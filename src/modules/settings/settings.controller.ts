import { Request, Response } from "express";
import { SettingsService } from "./settings.service";
import { catchAsync } from "../../utils/catchAsync";

const service = new SettingsService();

export const getSettings = catchAsync(async (_req: Request, res: Response) => {
  const data = await service.getAll();
  res.status(200).json({ success: true, data });
});

export const updateSettings = catchAsync(async (req: Request, res: Response) => {
  const { settings } = req.body;
  const data = await service.updateMany(settings);
  res.status(200).json({ success: true, data });
});
