import { Request, Response } from "express";
import { WishlistService } from "./wishlist.service";
import { catchAsync } from "../../utils/catchAsync";
import { AppError } from "../../utils/AppError";

const service = new WishlistService();

export const getWishlist = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401, "UNAUTHORIZED");
  }
  const data = await service.getWishlist(req.user.id);
  res.status(200).json({ success: true, data });
});

export const addWishlistItem = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401, "UNAUTHORIZED");
  }
  const data = await service.addItem(req.user.id, req.body.productId);
  res.status(201).json({ success: true, data });
});

export const removeWishlistItem = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401, "UNAUTHORIZED");
  }
  const data = await service.removeItem(req.user.id, req.params.productId);
  res.status(200).json({ success: true, data });
});
