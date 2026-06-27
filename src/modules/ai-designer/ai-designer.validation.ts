import { z } from "zod";

const TSHIRT_COLORS = ["White", "Black", "Navy", "Gray", "Red"] as const;
const TSHIRT_SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;

export const generateDesignSchema = z.object({
  body: z.object({
    prompt: z
      .string({ required_error: "Design description is required" })
      .min(10, "Description must be at least 10 characters")
      .max(500, "Description cannot exceed 500 characters"),
    shirtColor: z.enum(TSHIRT_COLORS, {
      required_error: "T-shirt color is required",
      invalid_type_error: "Invalid t-shirt color",
    }),
    size: z.enum(TSHIRT_SIZES, {
      required_error: "T-shirt size is required",
      invalid_type_error: "Invalid t-shirt size",
    }),
  }),
});

export const addToCartSchema = z.object({
  body: z.object({
    designId: z
      .string({ required_error: "Design ID is required" })
      .min(1, "Design ID cannot be empty"),
    quantity: z
      .number({ required_error: "Quantity is required", invalid_type_error: "Quantity must be a number" })
      .min(1, "Quantity must be at least 1")
      .max(10, "Maximum quantity is 10"),
  }),
});

export const updateCustomCartSchema = z.object({
  body: z.object({
    quantity: z
      .number({ required_error: "Quantity is required", invalid_type_error: "Quantity must be a number" })
      .min(1, "Quantity must be at least 1")
      .max(10, "Maximum quantity is 10"),
  }),
});

export const aiSettingsUpdateSchema = z.object({
  body: z.object({
    settings: z.array(
      z.object({
        key: z.string(),
        value: z.any(),
        group: z.string().default("ai_designer"),
      })
    ),
  }),
});
