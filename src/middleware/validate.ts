import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { AppError } from "../utils/AppError";

export const validate = (schema: ZodSchema) => (req: Request, _res: Response, next: NextFunction) => {
  const result = schema.safeParse({
    body: req.body,
    params: req.params,
    query: req.query,
  });

  if (!result.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const [key, value] of Object.entries(result.error.flatten().fieldErrors)) {
      if (value) fieldErrors[key] = value;
    }
    return next(
      new AppError("Validation failed", 400, "VALIDATION_ERROR", fieldErrors)
    );
  }

  return next();
};
