import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { validate } from "../../middleware/validate";
import { loginLimiter, registerLimiter, forgotPasswordLimiter } from "../../middleware/rateLimiter";
import {
  forgotPasswordSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
  resetPasswordSchema,
} from "./auth.validation";
import { forgotPassword, login, logout, refresh, register, resetPassword } from "./auth.controller";

export const authRoutes = Router();

authRoutes.post("/register", registerLimiter, validate(registerSchema), register);
authRoutes.post("/login", loginLimiter, validate(loginSchema), login);
authRoutes.post("/refresh", validate(refreshSchema), refresh);
authRoutes.post("/logout", authenticate, logout);
authRoutes.post("/forgot-password", forgotPasswordLimiter, validate(forgotPasswordSchema), forgotPassword);
authRoutes.post("/reset-password", forgotPasswordLimiter, validate(resetPasswordSchema), resetPassword);
