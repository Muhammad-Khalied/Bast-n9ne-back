import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";

export const authorize = (...roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError("Insufficient permissions", 403, "FORBIDDEN"));
    }
    return next();
  };
};
