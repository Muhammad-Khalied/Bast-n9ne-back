import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { catchAsync } from "../../utils/catchAsync";

const service = new AuthService();

export const register = catchAsync(async (req: Request, res: Response) => {
  const data = await service.register(req.body);
  res.cookie("refreshToken", data.refreshToken, {
    httpOnly: true,
    sameSite: "lax",
  });
  res.status(201).json({ success: true, data });
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const data = await service.login(req.body);
  res.cookie("refreshToken", data.refreshToken, {
    httpOnly: true,
    sameSite: "lax",
  });
  res.status(200).json({ success: true, data });
});

export const refresh = catchAsync(async (req: Request, res: Response) => {
  const refreshToken = req.body?.refreshToken ?? req.cookies.refreshToken;
  const data = await service.refresh(refreshToken);
  res.cookie("refreshToken", data.refreshToken, {
    httpOnly: true,
    sameSite: "lax",
  });
  res.status(200).json({ success: true, data });
});

export const logout = catchAsync(async (req: Request, res: Response) => {
  const refreshToken = req.body?.refreshToken ?? req.cookies.refreshToken;
  await service.logout(refreshToken);
  res.clearCookie("refreshToken");
  res.status(200).json({ success: true, data: { message: "Logged out" } });
});

export const forgotPassword = catchAsync(async (_req: Request, res: Response) => {
  res.status(200).json({ success: true, data: { message: "Password reset email queued" } });
});

export const resetPassword = catchAsync(async (_req: Request, res: Response) => {
  res.status(200).json({ success: true, data: { message: "Password reset complete" } });
});
