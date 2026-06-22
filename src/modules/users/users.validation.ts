import { z } from "zod";

export const profileUpdateSchema = z.object({
  body: z.object({
    firstName: z.string({ required_error: "First name is required" }).min(2, "First name must be at least 2 characters long").optional(),
    lastName: z.string({ required_error: "Last name is required" }).min(2, "Last name must be at least 2 characters long").optional(),
    phone: z.string().optional(),
    avatar: z.string().optional(),
  }),
});

export const passwordChangeSchema = z.object({
  body: z.object({
    currentPassword: z.string({ required_error: "Current password is required" }).min(1, "Please enter your current password"),
    newPassword: z.string({ required_error: "New password is required" }).min(8, "New password must be at least 8 characters long"),
  }),
});

export const addressSchema = z.object({
  body: z.object({
    label: z.string().optional(),
    fullName: z.string({ required_error: "Full name is required" }).min(1, "Please enter a full name for the address"),
    phone: z.string({ required_error: "Phone number is required" }).min(1, "Please enter a phone number"),
    street: z.string({ required_error: "Street address is required" }).min(1, "Please enter a street address"),
    city: z.string({ required_error: "City is required" }).min(1, "Please enter a city"),
    state: z.string({ required_error: "State/Province is required" }).min(1, "Please enter a state/province"),
    country: z.string().optional(),
    isDefault: z.boolean().optional(),
  }),
});

export const userStatusSchema = z.object({
  body: z.object({
    status: z.enum(["ACTIVE", "SUSPENDED", "DEACTIVATED"], { required_error: "Status is required", invalid_type_error: "Invalid account status" }),
  }),
});
