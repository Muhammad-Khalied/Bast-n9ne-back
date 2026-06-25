import rateLimit from "express-rate-limit";

const isProd = process.env.NODE_ENV === "production";

export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: isProd ? 300 : 5000,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: isProd ? 10 : 100, // 10 requests per 15 min in prod
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { success: false, error: { message: "Too many login attempts, please try again later.", code: "TOO_MANY_REQUESTS" } }
});

export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 minutes
  limit: isProd ? 5 : 50, // 5 requests per hour in prod
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { success: false, error: { message: "Too many accounts created from this IP, please try again later.", code: "TOO_MANY_REQUESTS" } }
});

export const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 minutes
  limit: isProd ? 3 : 30, // 3 requests per hour in prod
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { success: false, error: { message: "Too many password reset requests, please try again later.", code: "TOO_MANY_REQUESTS" } }
});

export const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: isProd ? 10 : 100, // 10 orders per 15 min
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { success: false, error: { message: "Too many orders placed, please try again later.", code: "TOO_MANY_REQUESTS" } }
});

export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: isProd ? 20 : 100, // 20 uploads per 15 min
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { success: false, error: { message: "Too many file uploads, please try again later.", code: "TOO_MANY_REQUESTS" } }
});
