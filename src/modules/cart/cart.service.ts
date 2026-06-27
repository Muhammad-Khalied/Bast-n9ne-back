import { prisma } from "../../config/database";
import { AppError } from "../../utils/AppError";

export class CartService {
  async getCart(userId: string) {
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: { include: { media: { orderBy: { sortOrder: "asc" }, take: 1 } } },
            variant: true,
          },
          orderBy: { createdAt: "desc" },
        },
        customItems: {
          include: { design: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!cart) return null;

    // Self-healing: remove items where product is no longer PUBLISHED or variant is inactive
    const invalidItems = cart.items.filter(item => item.product.status !== "PUBLISHED" || !item.variant.isActive);
    
    if (invalidItems.length > 0) {
      await prisma.cartItem.deleteMany({
        where: { id: { in: invalidItems.map(i => i.id) } }
      });
      cart.items = cart.items.filter(item => item.product.status === "PUBLISHED" && item.variant.isActive);
    }

    return cart;
  }

  async ensureCart(userId: string) {
    const existing = await prisma.cart.findUnique({ where: { userId } });
    if (existing) return existing;
    return prisma.cart.create({ data: { userId } });
  }

  async addItem(userId: string, productId: string, variantId: string, quantity: number) {
    const variant = await prisma.productVariant.findUnique({ 
      where: { id: variantId },
      include: { product: true }
    });
    if (!variant || variant.productId !== productId) {
      throw new AppError("Invalid product variant", 400, "INVALID_VARIANT");
    }
    if (variant.product.status !== "PUBLISHED") {
      throw new AppError("Product is no longer available", 400, "PRODUCT_UNAVAILABLE");
    }

    const cart = await this.ensureCart(userId);
    const existingItem = await prisma.cartItem.findUnique({
      where: { cartId_variantId: { cartId: cart.id, variantId } },
    });

    const newQuantity = (existingItem?.quantity || 0) + quantity;

    if (newQuantity > variant.stock) {
      throw new AppError("Not enough stock available", 400, "INSUFFICIENT_STOCK");
    }

    return prisma.cartItem.upsert({
      where: { cartId_variantId: { cartId: cart.id, variantId } },
      update: { quantity: newQuantity },
      create: { cartId: cart.id, productId, variantId, quantity },
    });
  }

  async updateQuantity(userId: string, cartItemId: string, quantity: number) {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      throw new AppError("Cart not found", 404, "CART_NOT_FOUND");
    }

    const item = await prisma.cartItem.findUnique({
      where: { cartId: cart.id, id: cartItemId },
      include: { variant: true },
    });

    if (!item) {
      throw new AppError("Item not found in cart", 404, "ITEM_NOT_FOUND");
    }

    if (quantity > item.variant.stock) {
      throw new AppError("Not enough stock available", 400, "INSUFFICIENT_STOCK");
    }

    return prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
    });
  }

  async removeItem(userId: string, cartItemId: string) {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      return { message: "Item removed" };
    }

    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id, id: cartItemId },
    });
    return { message: "Item removed" };
  }

  async clearCart(userId: string) {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      return { message: "Cart cleared" };
    }

    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });
    await prisma.customCartItem.deleteMany({
      where: { cartId: cart.id },
    });
    return { message: "Cart cleared" };
  }
}
