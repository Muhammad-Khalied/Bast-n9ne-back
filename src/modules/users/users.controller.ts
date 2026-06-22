import { Request, Response } from "express";
import { UsersService } from "./users.service";
import { catchAsync } from "../../utils/catchAsync";
import { AppError } from "../../utils/AppError";

const service = new UsersService();

export const getProfile = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError("Authentication required", 401, "UNAUTHORIZED");
  const data = await service.getProfile(req.user.id);
  res.status(200).json({ success: true, data });
});

export const updateProfile = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError("Authentication required", 401, "UNAUTHORIZED");
  const data = await service.updateProfile(req.user.id, req.body);
  res.status(200).json({ success: true, data });
});

export const changePassword = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError("Authentication required", 401, "UNAUTHORIZED");
  await service.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword);
  res.status(200).json({ success: true, data: { message: "Password updated" } });
});

export const listAddresses = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError("Authentication required", 401, "UNAUTHORIZED");
  const data = await service.listAddresses(req.user.id);
  res.status(200).json({ success: true, data });
});

export const addAddress = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError("Authentication required", 401, "UNAUTHORIZED");
  const data = await service.addAddress(req.user.id, req.body);
  res.status(201).json({ success: true, data });
});

export const updateAddress = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError("Authentication required", 401, "UNAUTHORIZED");
  const data = await service.updateAddress(req.user.id, req.params.id, req.body);
  res.status(200).json({ success: true, data });
});

export const removeAddress = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError("Authentication required", 401, "UNAUTHORIZED");
  await service.removeAddress(req.user.id, req.params.id);
  res.status(200).json({ success: true, data: { message: "Address removed" } });
});

export const adminListUsers = catchAsync(async (_req: Request, res: Response) => {
  const data = await service.adminList();
  res.status(200).json({ success: true, data });
});

export const adminGetUser = catchAsync(async (req: Request, res: Response) => {
  const data = await service.adminGet(req.params.id);
  res.status(200).json({ success: true, data });
});

export const adminUpdateStatus = catchAsync(async (req: Request, res: Response) => {
  if (req.params.id === req.user?.id) {
    throw new AppError("You cannot modify your own status", 403, "FORBIDDEN");
  }
  const data = await service.adminUpdateStatus(req.params.id, req.body.status);
  res.status(200).json({ success: true, data });
});
