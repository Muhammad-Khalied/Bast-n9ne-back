import { Request, Response } from "express";
import { CategoriesService } from "./categories.service";
import { catchAsync } from "../../utils/catchAsync";

const service = new CategoriesService();

export const listCategories = catchAsync(async (_req: Request, res: Response) => {
  const data = await service.list();
  res.status(200).json({ success: true, data });
});

export const listAdminCategories = catchAsync(async (_req: Request, res: Response) => {
  const data = await service.listAdmin();
  res.status(200).json({ success: true, data });
});

export const getCategory = catchAsync(async (req: Request, res: Response) => {
  const data = await service.getBySlug(req.params.slug);
  res.status(200).json({ success: true, data });
});

export const getAdminCategory = catchAsync(async (req: Request, res: Response) => {
  const data = await service.getById(req.params.id);
  res.status(200).json({ success: true, data });
});

export const createCategory = catchAsync(async (req: Request, res: Response) => {
  const data = await service.create(req.body);
  res.status(201).json({ success: true, data });
});

export const updateCategory = catchAsync(async (req: Request, res: Response) => {
  const data = await service.update(req.params.id, req.body);
  res.status(200).json({ success: true, data });
});

export const deleteCategory = catchAsync(async (req: Request, res: Response) => {
  await service.remove(req.params.id);
  res.status(200).json({ success: true, data: { message: "Category removed" } });
});
