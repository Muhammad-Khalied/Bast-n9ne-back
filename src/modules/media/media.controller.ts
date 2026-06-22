import { Request, Response } from "express";
import { MediaService } from "./media.service";
import { catchAsync } from "../../utils/catchAsync";
import { AppError } from "../../utils/AppError";

const service = new MediaService();

export const uploadMedia = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new AppError("File required", 400, "FILE_REQUIRED");
  }

  const productId = req.body.productId;
  const altText = req.body.altText;
  const result = await service.upload(req.file, productId, altText);

  res.status(201).json({ success: true, data: result });
});

export const uploadReceipt = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new AppError("File required", 400, "FILE_REQUIRED");
  }

  const result = await service.upload(req.file);

  res.status(201).json({ success: true, data: result });
});

export const deleteMedia = catchAsync(async (req: Request, res: Response) => {
  await service.delete(req.params.id);
  res.status(200).json({ success: true, data: { message: "Media deleted" } });
});

export const reorderMedia = catchAsync(async (req: Request, res: Response) => {
  await service.reorder(req.body.items);
  res.status(200).json({ success: true, data: { message: "Media reordered" } });
});
