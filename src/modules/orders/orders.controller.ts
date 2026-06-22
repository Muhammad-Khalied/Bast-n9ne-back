import { Request, Response } from "express";
import { OrdersService } from "./orders.service";
import { catchAsync } from "../../utils/catchAsync";
import { AppError } from "../../utils/AppError";

const service = new OrdersService();

export const createOrder = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401, "UNAUTHORIZED");
  }
  const data = await service.createOrder(
    req.user.id,
    req.body.addressId,
    req.body.notes,
    req.body.paymentMethod,
    req.body.receiptUrl
  );
  res.status(201).json({ success: true, data });
});

export const listOrders = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401, "UNAUTHORIZED");
  }
  const data = await service.listForUser(req.user.id);
  res.status(200).json({ success: true, data });
});

export const getOrder = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401, "UNAUTHORIZED");
  }
  const data = await service.getForUser(req.user.id, req.params.id);
  res.status(200).json({ success: true, data });
});

export const listAdminOrders = catchAsync(async (_req: Request, res: Response) => {
  const data = await service.listAdmin();
  res.status(200).json({ success: true, data });
});

export const getAdminOrder = catchAsync(async (req: Request, res: Response) => {
  const data = await service.getAdmin(req.params.id);
  res.status(200).json({ success: true, data });
});

export const updateOrderStatus = catchAsync(async (req: Request, res: Response) => {
  const data = await service.updateStatus(req.params.id, req.body.status, req.body.paymentStatus);
  res.status(200).json({ success: true, data });
});
