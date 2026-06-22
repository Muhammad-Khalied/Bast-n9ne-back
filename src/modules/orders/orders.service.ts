import { prisma } from "../../config/database";
import { AppError } from "../../utils/AppError";
import { createOrderNumber } from "../../utils/orderNumber";

export class OrdersService {
  async createOrder(userId: string, addressId: string, notes?: string, paymentMethod: any = "CASH_ON_DELIVERY", paymentReceiptUrl?: string) {
    const address = await prisma.address.findFirst({ where: { id: addressId, userId } });
    if (!address) {
      throw new AppError("Address not found", 404, "ADDRESS_NOT_FOUND");
    }

    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: { include: { media: { orderBy: { sortOrder: "asc" }, take: 1 } } },
            variant: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new AppError("Cart is empty", 400, "CART_EMPTY");
    }

    const subtotal = cart.items.reduce((sum, item) => {
      return sum + Number(item.product.discountPrice ?? item.product.price) * item.quantity;
    }, 0);

    const shippingCost = 150;
    const total = subtotal + shippingCost;

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber: createOrderNumber(),
          userId,
          addressId,
          subtotal,
          shippingCost,
          total,
          notes,
          paymentMethod,
          paymentReceiptUrl,
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              title: item.product.title,
              size: item.variant.size,
              color: item.variant.color,
              price: item.product.discountPrice ?? item.product.price,
              quantity: item.quantity,
              subtotal: Number(item.product.discountPrice ?? item.product.price) * item.quantity,
              imageUrl: item.product.media?.[0]?.url ?? null,
            })),
          },
        },
        include: { items: true },
      });

      for (const item of cart.items) {
        if (item.product.status !== "PUBLISHED" || !item.variant.isActive) {
          throw new AppError(`Product "${item.product.title}" is no longer available. Please review your cart.`, 400, "PRODUCT_UNAVAILABLE");
        }
        if (item.variant.stock < item.quantity) {
          throw new AppError(`Insufficient stock for "${item.product.title}"`, 400, "OUT_OF_STOCK");
        }
        const updatedVariant = await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity } },
        });

        if (updatedVariant.stock < 0) {
          throw new AppError(`Insufficient stock for "${item.product.title}"`, 400, "OUT_OF_STOCK");
        }

        await tx.inventoryMovement.create({
          data: {
            variantId: item.variantId,
            type: "SALE",
            quantity: -item.quantity,
            reference: created.id,
            performedBy: userId,
          },
        });
      }

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return created;
    });

    return order;
  }

  async listForUser(userId: string) {
    return prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { items: true },
    });
  }

  async getForUser(userId: string, id: string) {
    const order = await prisma.order.findFirst({
      where: { id, userId },
      include: { items: true, address: true },
    });

    if (!order) {
      throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");
    }

    return order;
  }

  async listAdmin() {
    return prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: true, items: true },
    });
  }

  async getAdmin(id: string) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: true,
        address: true,
        items: {
          include: {
            product: {
              include: {
                media: { orderBy: { sortOrder: "asc" }, take: 1 },
              },
            },
            variant: true,
          },
        },
      },
    });

    if (!order) {
      throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");
    }

    return order;
  }

  async updateStatus(id: string, status?: string, paymentStatus?: string) {
    const data: any = {};
    if (status) data.status = status;
    if (paymentStatus) data.paymentStatus = paymentStatus;

    return prisma.order.update({
      where: { id },
      data,
    });
  }
}
