import { Request, Response } from "express";
import { ProductsService } from "./products.service";
import { catchAsync } from "../../utils/catchAsync";

const service = new ProductsService();

export const listProducts = catchAsync(async (req: Request, res: Response) => {
  const data = await service.list(req.query as Record<string, string>);
  res.status(200).json({ success: true, data: { products: data.products }, meta: data.meta });
});

export const listAdminProducts = catchAsync(async (req: Request, res: Response) => {
  const data = await service.listAdmin(req.query as Record<string, string>);
  res.status(200).json({ success: true, data: { products: data.products }, meta: data.meta });
});

export const getProduct = catchAsync(async (req: Request, res: Response) => {
  const data = await service.getBySlug(req.params.slug);
  res.status(200).json({ success: true, data });
});

export const getAdminProduct = catchAsync(async (req: Request, res: Response) => {
  const data = await service.getById(req.params.id);
  res.status(200).json({ success: true, data });
});

export const getRelated = catchAsync(async (req: Request, res: Response) => {
  const data = await service.getRelated(req.params.slug);
  res.status(200).json({ success: true, data });
});

export const getFeatured = catchAsync(async (_req: Request, res: Response) => {
  const data = await service.featured();
  res.status(200).json({ success: true, data });
});

export const getNewArrivals = catchAsync(async (_req: Request, res: Response) => {
  const data = await service.newArrivals();
  res.status(200).json({ success: true, data });
});

export const getBestSellers = catchAsync(async (_req: Request, res: Response) => {
  const data = await service.bestSellers();
  res.status(200).json({ success: true, data });
});

export const createProduct = catchAsync(async (req: Request, res: Response) => {
  const data = await service.create(req.body);
  res.status(201).json({ success: true, data });
});

export const updateProduct = catchAsync(async (req: Request, res: Response) => {
  const data = await service.update(req.params.id, req.body);
  res.status(200).json({ success: true, data });
});

export const deleteProduct = catchAsync(async (req: Request, res: Response) => {
  await service.remove(req.params.id);
  res.status(200).json({ success: true, data: { message: "Product removed" } });
});
