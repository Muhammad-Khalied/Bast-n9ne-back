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
        customItems: {
          include: { design: true },
        },
      },
    });

    if (!cart || (cart.items.length === 0 && cart.customItems.length === 0)) {
      throw new AppError("Cart is empty", 400, "CART_EMPTY");
    }

    const regularSubtotal = cart.items.reduce((sum, item) => {
      return sum + Number(item.product.discountPrice ?? item.product.price) * item.quantity;
    }, 0);

    const customSubtotal = cart.customItems.reduce((sum, item) => {
      return sum + Number(item.unitPrice) * item.quantity;
    }, 0);

    const subtotal = regularSubtotal + customSubtotal;
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
          customItems: {
            create: cart.customItems.map((item) => ({
              designId: item.designId,
              title: `Custom AI T-Shirt — ${item.design.shirtColor}`,
              prompt: item.design.prompt,
              imageUrl: item.design.imageUrl,
              shirtColor: item.design.shirtColor,
              size: item.design.size,
              price: item.unitPrice,
              quantity: item.quantity,
              subtotal: Number(item.unitPrice) * item.quantity,
            })),
          },
        },
        include: { items: true, customItems: true },
      });

      // Process regular items: validate, decrement stock, record inventory
      for (const item of cart.items) {
        if (item.product.status !== "PUBLISHED" || !item.variant.isActive) {
          throw new AppError(`Product "${item.product.title}" is no longer available. Please review your cart.`, 400, "PRODUCT_UNAVAILABLE");
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

      // Mark custom designs as ordered
      for (const item of cart.customItems) {
        await tx.customTShirtDesign.update({
          where: { id: item.designId },
          data: { status: "ORDERED" },
        });
      }

      // Clear cart
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      await tx.customCartItem.deleteMany({ where: { cartId: cart.id } });

      return created;
    });

    return order;
  }

  async listForUser(userId: string) {
    return prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { items: true, customItems: true },
    });
  }

  async getForUser(userId: string, id: string) {
    const order = await prisma.order.findFirst({
      where: { id, userId },
      include: { items: true, customItems: true, address: true },
    });

    if (!order) {
      throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");
    }

    return order;
  }

  async listAdmin() {
    return prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: true, items: true, customItems: true },
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
        customItems: {
          include: { design: true },
        },
      },
    });

    if (!order) {
      throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");
    }

    return order;
  }

  async updateStatus(id: string, status?: string, paymentStatus?: string) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");
    }

    return prisma.$transaction(async (tx) => {
      const data: any = {};
      
      if (status) {
        data.status = status;
        
        if (status === "CANCELLED" && order.status !== "CANCELLED") {
          data.cancelledAt = new Date();
          
          for (const item of order.items) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { stock: { increment: item.quantity } },
            });
            
            await tx.inventoryMovement.create({
              data: {
                variantId: item.variantId,
                type: "RETURN",
                quantity: item.quantity,
                reference: order.id,
                performedBy: "SYSTEM",
              },
            });
          }
        } else if (order.status === "CANCELLED" && status !== "CANCELLED") {
          data.cancelledAt = null;
          
          for (const item of order.items) {
            const variant = await tx.productVariant.findUnique({
              where: { id: item.variantId },
              include: { product: true },
            });

            if (!variant || variant.product.status === "ARCHIVED") {
              throw new AppError(`Cannot update order because product "${item.title}" has been deleted`, 400, "PRODUCT_DELETED");
            }

            if (variant.stock < item.quantity) {
              throw new AppError(`Insufficient stock for "${item.title}" to update this order from cancelled`, 400, "OUT_OF_STOCK");
            }
            
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { stock: { decrement: item.quantity } },
            });
            
            await tx.inventoryMovement.create({
              data: {
                variantId: item.variantId,
                type: "SALE",
                quantity: -item.quantity,
                reference: order.id,
                performedBy: "SYSTEM",
              },
            });
          }
        }
      }
      
      if (paymentStatus) data.paymentStatus = paymentStatus;

      return tx.order.update({
        where: { id },
        data,
      });
    });
  }
}
