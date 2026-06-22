import { prisma } from "../../config/database";
import { AppError } from "../../utils/AppError";

export class WishlistService {
  async getWishlist(userId: string) {
    const wishlist = await prisma.wishlist.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: { include: { media: { orderBy: { sortOrder: "asc" }, take: 1 } } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!wishlist) return null;

    const invalidItems = wishlist.items.filter(item => item.product.status !== "PUBLISHED");
    
    if (invalidItems.length > 0) {
      await prisma.wishlistItem.deleteMany({
        where: { id: { in: invalidItems.map(i => i.id) } }
      });
      wishlist.items = wishlist.items.filter(item => item.product.status === "PUBLISHED");
    }

    return wishlist;
  }

  async ensureWishlist(userId: string) {
    const existing = await prisma.wishlist.findUnique({ where: { userId } });
    if (existing) return existing;
    return prisma.wishlist.create({ data: { userId } });
  }

  async addItem(userId: string, productId: string) {
    const product = await prisma.product.findFirst({
      where: { id: productId, status: "PUBLISHED" },
      select: { id: true },
    });
    if (!product) {
      throw new AppError("Product not found", 404, "PRODUCT_NOT_FOUND");
    }

    const wishlist = await this.ensureWishlist(userId);
    return prisma.wishlistItem.upsert({
      where: { wishlistId_productId: { wishlistId: wishlist.id, productId } },
      update: {},
      create: { wishlistId: wishlist.id, productId },
    });
  }

  async removeItem(userId: string, productId: string) {
    const wishlist = await prisma.wishlist.findUnique({ where: { userId } });
    if (!wishlist) {
      return { message: "Item removed" };
    }

    await prisma.wishlistItem.deleteMany({
      where: { wishlistId: wishlist.id, productId },
    });
    return { message: "Item removed" };
  }
}
