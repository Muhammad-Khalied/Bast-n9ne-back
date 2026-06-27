import { Request, Response } from "express";
import { AiDesignerService } from "./ai-designer.service";
import { catchAsync } from "../../utils/catchAsync";
import { AppError } from "../../utils/AppError";

const service = new AiDesignerService();

export const generateDesign = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401, "UNAUTHORIZED");
  }
  const data = await service.generateDesign(
    req.user.id,
    req.body.prompt,
    req.body.shirtColor,
    req.body.size
  );
  res.status(201).json({ success: true, data });
});

export const getDesign = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401, "UNAUTHORIZED");
  }
  const data = await service.getDesign(req.user.id, req.params.id);
  res.status(200).json({ success: true, data });
});

export const getUserDesigns = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401, "UNAUTHORIZED");
  }
  const data = await service.getUserDesigns(req.user.id);
  res.status(200).json({ success: true, data });
});

export const addToCart = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401, "UNAUTHORIZED");
  }
  const data = await service.addToCart(req.user.id, req.body.designId, req.body.quantity);
  res.status(201).json({ success: true, data });
});

export const getCustomCartItems = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401, "UNAUTHORIZED");
  }
  const data = await service.getCustomCartItems(req.user.id);
  res.status(200).json({ success: true, data });
});

export const updateCustomCartItem = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401, "UNAUTHORIZED");
  }
  const data = await service.updateCustomCartItemQuantity(req.user.id, req.params.id, req.body.quantity);
  res.status(200).json({ success: true, data });
});

export const removeCustomCartItem = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401, "UNAUTHORIZED");
  }
  await service.removeCustomCartItem(req.user.id, req.params.id);
  res.status(200).json({ success: true, data: { message: "Item removed" } });
});

export const getAiSettings = catchAsync(async (_req: Request, res: Response) => {
  const data = await service.getSettings();
  res.status(200).json({ success: true, data });
});

export const updateAiSettings = catchAsync(async (req: Request, res: Response) => {
  const { settings } = req.body;
  const data = await service.updateSettings(settings);
  res.status(200).json({ success: true, data });
});
