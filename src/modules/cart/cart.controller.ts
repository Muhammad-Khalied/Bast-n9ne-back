import { Request, Response } from "express";
import { CartService } from "./cart.service";
import { catchAsync } from "../../utils/catchAsync";
import { AppError } from "../../utils/AppError";

const service = new CartService();

export const getCart = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401, "UNAUTHORIZED");
  }
  const data = await service.getCart(req.user.id);
  res.status(200).json({ success: true, data });
});

export const addCartItem = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401, "UNAUTHORIZED");
  }
  const data = await service.addItem(req.user.id, req.body.productId, req.body.variantId, req.body.quantity);
  res.status(201).json({ success: true, data });
});

export const updateCartItem = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401, "UNAUTHORIZED");
  }
  const data = await service.updateQuantity(req.user.id, req.params.id, req.body.quantity);
  res.status(200).json({ success: true, data });
});

export const removeCartItem = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401, "UNAUTHORIZED");
  }
  await service.removeItem(req.user.id, req.params.id);
  res.status(200).json({ success: true, data: { message: "Item removed" } });
});

export const clearCart = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401, "UNAUTHORIZED");
  }
  await service.clearCart(req.user.id);
  res.status(200).json({ success: true, data: { message: "Cart cleared" } });
});
