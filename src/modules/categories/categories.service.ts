import { prisma } from "../../config/database";
import { AppError } from "../../utils/AppError";

export class CategoriesService {
  async list() {
    return prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: { children: true },
    });
  }

  async listAdmin() {
    return prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: {
        children: true,
        _count: { select: { products: true } },
      },
    });
  }

  async getBySlug(slug: string) {
    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        products: {
          where: { status: "PUBLISHED" },
          include: { media: { orderBy: { sortOrder: "asc" }, take: 1 } },
        },
      },
    });

    if (!category) {
      throw new AppError("Category not found", 404, "CATEGORY_NOT_FOUND");
    }

    return category;
  }

  async getById(id: string) {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        children: true,
        _count: { select: { products: true } },
      },
    });

    if (!category) {
      throw new AppError("Category not found", 404, "CATEGORY_NOT_FOUND");
    }

    return category;
  }

  async create(data: any) {
    return prisma.category.create({ data });
  }

  async update(id: string, data: any) {
    return prisma.category.update({ where: { id }, data });
  }

  async remove(id: string) {
    return prisma.category.delete({ where: { id } });
  }
}
