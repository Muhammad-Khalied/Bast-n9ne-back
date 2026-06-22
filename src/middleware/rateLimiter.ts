import rateLimit from "express-rate-limit";

export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: process.env.NODE_ENV === "production" ? 300 : 5000, // Higher limit for local development
  standardHeaders: "draft-7",
  legacyHeaders: false,
});
