import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    email: z.string({ required_error: "Email is required" }).email("Please enter a valid email address"),
    password: z
      .string({ required_error: "Password is required" })
      .min(8, "Password must be at least 8 characters long")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    firstName: z.string({ required_error: "First name is required" }).min(2, "First name must be at least 2 characters long"),
    lastName: z.string({ required_error: "Last name is required" }).min(2, "Last name must be at least 2 characters long"),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string({ required_error: "Email is required" }).email("Please enter a valid email address"),
    password: z.string({ required_error: "Password is required" }).min(1, "Please enter your password"),
  }),
});

export const refreshSchema = z.object({
  body: z
    .object({
      refreshToken: z.string({ required_error: "Refresh token is missing" }).optional(),
    })
    .optional()
    .default({}),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string({ required_error: "Email is required" }).email("Please enter a valid email address"),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string({ required_error: "Reset token is required" }).min(1, "Reset token cannot be empty"),
    password: z.string({ required_error: "Password is required" }).min(8, "Password must be at least 8 characters long"),
  }),
});
