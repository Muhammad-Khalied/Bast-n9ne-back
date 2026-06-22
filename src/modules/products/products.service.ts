import { Prisma } from "@prisma/client";
import { prisma } from "../../config/database";
import { AppError } from "../../utils/AppError";
import { parsePagination } from "../../utils/pagination";
import { slugify } from "../../utils/slugify";

export class ProductsService {
  private toArrayString(input: unknown): string[] {
    if (!input) return [];
    if (Array.isArray(input)) {
      return input
        .map((item) => String(item).trim())
        .filter(Boolean);
    }

    return String(input)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private normalizeColors(input: any, variants: any[] = []) {
    const fromInput = Array.isArray(input)
      ? input
      : typeof input === "string"
        ? this.toArrayString(input).map((name) => ({ name }))
        : [];

    const colorMap = new Map<string, { name: string; hex: string }>();

    fromInput.forEach((color: any) => {
      const name = String(color?.name ?? "").trim();
      if (!name) return;
      colorMap.set(name.toLowerCase(), {
        name,
        hex: String(color?.hex ?? "#000000"),
      });
    });

    variants.forEach((variant: any) => {
      const name = String(variant?.color ?? "").trim();
      if (!name || colorMap.has(name.toLowerCase())) return;
      colorMap.set(name.toLowerCase(), { name, hex: "#000000" });
    });

    return Array.from(colorMap.values());
  }

  private normalizeVariants(variantsInput: any, productSlug: string) {
    if (!Array.isArray(variantsInput)) return [];

    const seen = new Set<string>();
    const variants = variantsInput
      .map((variant: any) => {
        const size = String(variant?.size ?? "").trim();
        const color = String(variant?.color ?? "").trim();
        if (!size || !color) return null;

        const skuBase = `${productSlug.substring(0, 8).toUpperCase().replace(/-/g, "")}-${size.substring(0, 3).toUpperCase()}-${color.substring(0, 3).toUpperCase()}`;
        const sku = String(variant?.sku ?? "").trim() || skuBase;
        const key = `${size.toLowerCase()}::${color.toLowerCase()}`;
        if (seen.has(key)) return null;
        seen.add(key);

        return {
          id: variant?.id,
          size,
          color,
          sku,
          stock: Math.max(0, Number(variant?.stock ?? 0) || 0),
          isActive: variant?.isActive !== false,
        };
      })
      .filter(Boolean) as Array<{
      id?: string;
      size: string;
      color: string;
      sku: string;
      stock: number;
      isActive: boolean;
    }>;

    return variants;
  }

  async list(query: Record<string, string | undefined>) {
    const { page, perPage, skip } = parsePagination(query.page, query.perPage);

    const where: any = {
      status: "PUBLISHED",
      ...(query.minPrice && { price: { gte: Number(query.minPrice) } }),
      ...(query.maxPrice && { price: { lte: Number(query.maxPrice) } }),
      ...(query.search && {
        OR: [
          { title: { contains: query.search, mode: "insensitive" as const } },
          { description: { contains: query.search, mode: "insensitive" as const } },
        ],
      }),
    };

    if (query.category) {
      const categoryList = (Array.isArray(query.category) ? query.category : String(query.category).split(","))
        .map((s) => s.trim())
        .filter(Boolean);
      where.category = { slug: { in: categoryList } };
    }

    if (query.sizes) {
      const sizeList = (Array.isArray(query.sizes) ? query.sizes : String(query.sizes).split(","))
        .map((s) => s.trim())
        .filter(Boolean);
      where.sizes = { hasSome: sizeList };
    }

    if (query.tags) {
      const tagList = (Array.isArray(query.tags) ? query.tags : String(query.tags).split(","))
        .map((s) => s.trim())
        .filter(Boolean);
      where.tags = { hasSome: tagList };
    }

    if (query.colors) {
      const colorList = (Array.isArray(query.colors) ? query.colors : String(query.colors).split(","))
        .map((s) => s.trim())
        .filter(Boolean);
      where.variants = { some: { color: { in: colorList } } };
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      query.sort === "price_asc"
        ? { price: "asc" }
        : query.sort === "price_desc"
          ? { price: "desc" }
          : query.sort === "popular"
            ? { soldCount: "desc" }
            : query.sort === "name_asc"
              ? { title: "asc" }
              : { createdAt: "desc" };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: perPage,
        include: {
          media: { orderBy: { sortOrder: "asc" }, take: 2 },
          category: { select: { name: true, slug: true } },
          variants: { select: { stock: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return {
      products,
      meta: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  async listAdmin(query: Record<string, string | undefined>) {
    const { page, perPage, skip } = parsePagination(query.page, query.perPage);
    const where: any = {
      ...(query.status ? { status: query.status } : { status: { not: "ARCHIVED" } }),
      ...(query.category && { category: { slug: query.category } }),
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: perPage,
        include: {
          media: { orderBy: { sortOrder: "asc" }, take: 1 },
          category: { select: { id: true, name: true, slug: true } },
          variants: { select: { id: true, stock: true, isActive: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return {
      products,
      meta: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
    };
  }

  async getBySlug(slug: string) {
    const product = await prisma.product.findFirst({
      where: { slug, status: "PUBLISHED" },
      include: {
        media: { orderBy: { sortOrder: "asc" } },
        category: true,
        variants: true,
      },
    });

    if (!product) {
      throw new AppError("Product not found", 404, "PRODUCT_NOT_FOUND");
    }

    await prisma.product.update({
      where: { id: product.id },
      data: { viewCount: { increment: 1 } },
    });

    return product;
  }

  async getById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        media: { orderBy: { sortOrder: "asc" } },
        variants: { orderBy: [{ size: "asc" }, { color: "asc" }] },
        category: { select: { id: true, name: true, slug: true } },
      },
    });

    if (!product) {
      throw new AppError("Product not found", 404, "PRODUCT_NOT_FOUND");
    }

    return product;
  }

  async getRelated(slug: string) {
    const product = await prisma.product.findUnique({ where: { slug } });
    if (!product) {
      throw new AppError("Product not found", 404, "PRODUCT_NOT_FOUND");
    }

    return prisma.product.findMany({
      where: { categoryId: product.categoryId, id: { not: product.id }, status: "PUBLISHED" },
      take: 4,
      include: { media: { orderBy: { sortOrder: "asc" }, take: 1 } },
    });
  }

  async featured() {
    return prisma.product.findMany({
      where: { featured: true, status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { media: { orderBy: { sortOrder: "asc" }, take: 1 } },
    });
  }

  async newArrivals() {
    return prisma.product.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { media: { orderBy: { sortOrder: "asc" }, take: 1 } },
    });
  }

  async bestSellers() {
    return prisma.product.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { soldCount: "desc" },
      take: 8,
      include: { media: { orderBy: { sortOrder: "asc" }, take: 1 } },
    });
  }

  async create(input: any) {
    const slug = slugify(input.title);
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing) {
      throw new AppError("Product slug already exists", 409, "PRODUCT_EXISTS");
    }

    const variants = this.normalizeVariants(input.variants, slug);
    const data: Prisma.ProductCreateInput = {
      title: input.title,
      slug,
      description: input.description,
      shortDescription: input.shortDescription ?? null,
      price: Number(input.price),
      discountPrice: input.discountPrice == null ? null : Number(input.discountPrice),
      category: { connect: { id: input.categoryId } },
      ...(input.status !== undefined && { status: input.status }),
      tags: this.toArrayString(input.tags),
      sizes: this.toArrayString(input.sizes),
      colors: this.normalizeColors(input.colors, variants) as any,
      featured: Boolean(input.featured),
      seoTitle: input.seoTitle ?? null,
      seoDescription: input.seoDescription ?? null,
      ...(variants.length > 0 && {
        variants: {
          create: variants.map((variant) => ({
            size: variant.size,
            color: variant.color,
            sku: variant.sku,
            stock: variant.stock,
            isActive: variant.isActive,
          })),
        },
      }),
    };

    return prisma.product.create({
      data,
      include: {
        media: { orderBy: { sortOrder: "asc" } },
        variants: true,
        category: true,
      },
    });
  }

  async update(id: string, input: any) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new AppError("Product not found", 404, "PRODUCT_NOT_FOUND");
    }

    const nextSlug = input.title ? slugify(input.title) : product.slug;
    if (nextSlug !== product.slug) {
      const slugOwner = await prisma.product.findUnique({ where: { slug: nextSlug } });
      if (slugOwner && slugOwner.id !== id) {
        throw new AppError("Product slug already exists", 409, "PRODUCT_EXISTS");
      }
    }

    const variants = this.normalizeVariants(input.variants, nextSlug);

    return prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({
        where: { id },
        data: {
          ...(input.title !== undefined && { title: input.title }),
          ...(nextSlug !== product.slug && { slug: nextSlug }),
          ...(input.description !== undefined && { description: input.description }),
          ...(input.shortDescription !== undefined && { shortDescription: input.shortDescription ?? null }),
          ...(input.price !== undefined && { price: Number(input.price) }),
          ...(input.discountPrice !== undefined && { discountPrice: input.discountPrice == null ? null : Number(input.discountPrice) }),
          ...(input.categoryId !== undefined && { categoryId: input.categoryId }),
          ...(input.status !== undefined && { status: input.status }),
          ...(input.tags !== undefined && { tags: this.toArrayString(input.tags) }),
          ...(input.sizes !== undefined && { sizes: this.toArrayString(input.sizes) }),
          ...((input.colors !== undefined || input.variants !== undefined) && {
            colors: this.normalizeColors(input.colors ?? product.colors, variants) as any,
          }),
          ...(input.featured !== undefined && { featured: Boolean(input.featured) }),
          ...(input.seoTitle !== undefined && { seoTitle: input.seoTitle ?? null }),
          ...(input.seoDescription !== undefined && { seoDescription: input.seoDescription ?? null }),
        },
      });

      if (Array.isArray(input.variants)) {
        const existingVariants = await tx.productVariant.findMany({ where: { productId: id } });
        const providedIds = new Set(variants.map((variant) => variant.id).filter(Boolean));

        for (const variant of variants) {
          if (variant.id && existingVariants.some((existing) => existing.id === variant.id)) {
            await tx.productVariant.update({
              where: { id: variant.id },
              data: {
                size: variant.size,
                color: variant.color,
                sku: variant.sku,
                stock: variant.stock,
                isActive: variant.isActive,
              },
            });
            continue;
          }

          await tx.productVariant.create({
            data: {
              productId: id,
              size: variant.size,
              color: variant.color,
              sku: variant.sku,
              stock: variant.stock,
              isActive: variant.isActive,
            },
          });
        }

        const removedVariantIds = existingVariants
          .filter((existing) => !providedIds.has(existing.id))
          .map((existing) => existing.id);

        if (removedVariantIds.length > 0) {
          await tx.productVariant.updateMany({
            where: { id: { in: removedVariantIds } },
            data: { isActive: false },
          });
        }
      }

      if (input.status === "DRAFT" || input.status === "ARCHIVED") {
        await tx.cartItem.deleteMany({ where: { productId: id } });
        await tx.wishlistItem.deleteMany({ where: { productId: id } });
      }

      return tx.product.findUnique({
        where: { id: updated.id },
        include: {
          media: { orderBy: { sortOrder: "asc" } },
          variants: { orderBy: [{ size: "asc" }, { color: "asc" }] },
          category: true,
        },
      });
    });
  }

  async remove(id: string) {
    return prisma.$transaction([
      prisma.cartItem.deleteMany({ where: { productId: id } }),
      prisma.wishlistItem.deleteMany({ where: { productId: id } }),
      prisma.product.update({ 
        where: { id },
        data: { status: "ARCHIVED" }
      })
    ]);
  }
}
