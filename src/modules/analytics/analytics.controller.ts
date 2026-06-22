import { Request, Response } from "express";
import { AnalyticsService } from "./analytics.service";
import { catchAsync } from "../../utils/catchAsync";

const service = new AnalyticsService();

export const getOverview = catchAsync(async (_req: Request, res: Response) => {
  const data = await service.getOverview();
  res.status(200).json({ success: true, data });
});

export const getSales = catchAsync(async (req: Request, res: Response) => {
  const period = (req.query.period as string) || "30d";
  const data = await service.getSalesData(period);
  res.status(200).json({ success: true, data });
});

export const getProductPerformance = catchAsync(async (_req: Request, res: Response) => {
  const data = await service.getProductPerformance();
  res.status(200).json({ success: true, data });
});

export const getCategoryPerformance = catchAsync(async (_req: Request, res: Response) => {
  const data = await service.getCategoryPerformance();
  res.status(200).json({ success: true, data });
});

export const getOrderStatusBreakdown = catchAsync(async (_req: Request, res: Response) => {
  const data = await service.getOrderStatusBreakdown();
  res.status(200).json({ success: true, data });
});
