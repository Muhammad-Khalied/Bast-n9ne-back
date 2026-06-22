import { prisma } from "../../config/database";
import { AppError } from "../../utils/AppError";

export class InventoryService {
  async list() {
    const variants = await prisma.productVariant.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        product: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return variants
      .map((variant) => ({
        id: variant.id,
        productId: variant.productId,
        productTitle: variant.product.title,
        size: variant.size,
        color: variant.color,
        sku: variant.sku,
        stock: variant.stock,
        isActive: variant.isActive,
      }))
      .sort((a, b) => {
        const byTitle = a.productTitle.localeCompare(b.productTitle);
        if (byTitle !== 0) return byTitle;
        const bySize = a.size.localeCompare(b.size);
        if (bySize !== 0) return bySize;
        return a.color.localeCompare(b.color);
      });
  }

  async adjust(variantId: string, quantity: number, reason?: string, reference?: string, actorId?: string) {
    const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
    if (!variant) {
      throw new AppError("Variant not found", 404, "VARIANT_NOT_FOUND");
    }

    if (!Number.isFinite(quantity) || quantity === 0) {
      throw new AppError("Adjustment quantity must be a non-zero number", 400, "INVALID_QUANTITY");
    }

    const nextStock = variant.stock + quantity;
    if (nextStock < 0) {
      throw new AppError("Adjustment would make stock negative", 400, "NEGATIVE_STOCK");
    }

    const movement = await prisma.inventoryMovement.create({
      data: {
        variantId,
        type: "ADJUSTMENT",
        quantity,
        reason,
        reference,
        performedBy: actorId,
      },
    });

    await prisma.productVariant.update({
      where: { id: variantId },
      data: { stock: nextStock },
    });

    return movement;
  }
}
