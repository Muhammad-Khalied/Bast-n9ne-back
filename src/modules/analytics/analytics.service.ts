import { prisma } from "../../config/database";

export class AnalyticsService {
  async getOverview() {
    const [ordersCount, revenue, customers, products, pendingOrders, recentOrders, topProducts] =
      await Promise.all([
        prisma.order.count(),
        prisma.order.aggregate({ _sum: { total: true } }),
        prisma.user.count({ where: { role: "CUSTOMER" } }),
        prisma.product.count({ where: { status: "PUBLISHED" } }),
        prisma.order.count({ where: { status: "PENDING" } }),
        prisma.order.findMany({
          take: 10,
          orderBy: { createdAt: "desc" },
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        }),
        prisma.product.findMany({
          take: 5,
          orderBy: { soldCount: "desc" },
          select: {
            id: true,
            title: true,
            soldCount: true,
            price: true,
            media: { take: 1, orderBy: { sortOrder: "asc" } },
          },
        }),
      ]);

    // Calculate new customers this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const newCustomers = await prisma.user.count({
      where: { role: "CUSTOMER", createdAt: { gte: startOfMonth } },
    });

    // Low stock variants
    const lowStockProducts = await prisma.productVariant.findMany({
      where: { stock: { lte: 5 }, isActive: true },
      include: { product: { select: { title: true } } },
      take: 10,
    });

    return {
      totalRevenue: revenue._sum.total ? Number(revenue._sum.total) : 0,
      totalOrders: ordersCount,
      averageOrderValue: ordersCount > 0 ? Number(revenue._sum.total || 0) / ordersCount : 0,
      totalCustomers: customers,
      totalProducts: products,
      newCustomers,
      pendingOrders,
      lowStockProducts: lowStockProducts.length,
      recentOrders,
      topProducts,
      lowStockItems: lowStockProducts,
    };
  }

  async getSalesData(period: string = "30d") {
    const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: startDate }, status: { not: "CANCELLED" } },
      select: { createdAt: true, total: true },
      orderBy: { createdAt: "asc" },
    });

    // Group by day
    const salesByDay: Record<string, { date: string; revenue: number; orders: number }> = {};
    orders.forEach((order) => {
      const dateKey = order.createdAt.toISOString().split("T")[0];
      if (!salesByDay[dateKey]) {
        salesByDay[dateKey] = { date: dateKey, revenue: 0, orders: 0 };
      }
      salesByDay[dateKey].revenue += Number(order.total);
      salesByDay[dateKey].orders += 1;
    });

    return Object.values(salesByDay);
  }

  async getProductPerformance() {
    const products = await prisma.product.findMany({
      where: { status: "PUBLISHED" },
      select: {
        id: true,
        title: true,
        price: true,
        soldCount: true,
        viewCount: true,
        media: { take: 1, orderBy: { sortOrder: "asc" } },
        category: { select: { name: true } },
      },
      orderBy: { soldCount: "desc" },
      take: 20,
    });

    return products.map((p) => ({
      ...p,
      revenue: Number(p.price) * p.soldCount,
      conversionRate: p.viewCount > 0 ? ((p.soldCount / p.viewCount) * 100).toFixed(1) : "0",
    }));
  }

  async getCategoryPerformance() {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        products: {
          select: { soldCount: true, price: true },
          where: { status: "PUBLISHED" },
        },
      },
    });

    return categories.map((c) => ({
      id: c.id,
      name: c.name,
      productCount: c.products.length,
      totalSold: c.products.reduce((sum, p) => sum + p.soldCount, 0),
      totalRevenue: c.products.reduce((sum, p) => sum + Number(p.price) * p.soldCount, 0),
    }));
  }

  async getOrderStatusBreakdown() {
    const statuses = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"];
    const counts = await Promise.all(
      statuses.map(async (status) => ({
        status,
        count: await prisma.order.count({ where: { status: status as any } }),
      }))
    );
    return counts;
  }
}
