import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { prisma } from "../../config/database";

export const search = catchAsync(async (req: Request, res: Response) => {
  const term = String(req.query.q ?? "");
  const page = Math.max(1, Number(req.query.page) || 1);
  const perPage = Math.min(50, Math.max(1, Number(req.query.perPage) || 20));

  const where = {
    status: "PUBLISHED" as const,
    OR: [
      { title: { contains: term, mode: "insensitive" as const } },
      { description: { contains: term, mode: "insensitive" as const } },
      { tags: { hasSome: [term.toLowerCase()] } },
    ],
  };

  const [results, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip: (page - 1) * perPage,
      take: perPage,
      include: {
        media: { orderBy: { sortOrder: "asc" }, take: 1 },
        category: { select: { name: true, slug: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  res.status(200).json({
    success: true,
    data: results,
    meta: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
  });
});

export const suggestions = catchAsync(async (req: Request, res: Response) => {
  const term = String(req.query.q ?? "");
  if (term.length < 2) {
    res.status(200).json({ success: true, data: [] });
    return;
  }

  const results = await prisma.product.findMany({
    where: {
      status: "PUBLISHED",
      title: { contains: term, mode: "insensitive" as const },
    },
    take: 6,
    select: { title: true, slug: true },
  });

  res.status(200).json({ success: true, data: results });
});
