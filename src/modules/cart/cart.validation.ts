import { z } from "zod";

export const cartItemCreateSchema = z.object({
  body: z.object({
    productId: z.string({ required_error: "Product ID is required" }).min(1, "Product ID cannot be empty"),
    variantId: z.string({ required_error: "Variant ID is required" }).min(1, "Variant ID cannot be empty"),
    quantity: z.number({ required_error: "Quantity is required", invalid_type_error: "Quantity must be a number" }).min(1, "Quantity must be at least 1").max(100, "Maximum quantity is 100"),
  }),
});

export const cartItemUpdateSchema = z.object({
  body: z.object({
    quantity: z.number({ required_error: "Quantity is required", invalid_type_error: "Quantity must be a number" }).min(1, "Quantity must be at least 1").max(100, "Maximum quantity is 100"),
  }),
});
