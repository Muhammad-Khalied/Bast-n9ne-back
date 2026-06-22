import { z } from "zod";

export const inventoryAdjustSchema = z.object({
  body: z.object({
    variantId: z.string({ required_error: "Variant ID is required" }).min(1, "Variant ID cannot be empty"),
    quantity: z.number({ required_error: "Quantity is required", invalid_type_error: "Quantity must be a valid number" }),
    reason: z.string().optional(),
    reference: z.string().optional(),
  }),
});
