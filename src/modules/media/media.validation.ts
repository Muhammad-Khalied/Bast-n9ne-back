import { z } from "zod";

export const uploadMediaSchema = z.object({
  body: z.object({
    productId: z.string().optional(),
    altText: z.string().max(200, "Alt text cannot exceed 200 characters").optional(),
  }),
});

export const reorderMediaSchema = z.object({
  body: z.object({
    items: z.array(
      z.object({
        id: z.string({ required_error: "Media ID is required" }).min(1, "Media ID cannot be empty"),
        sortOrder: z.number({ required_error: "Sort order is required", invalid_type_error: "Sort order must be a number" }).int().min(0, "Sort order must be a positive integer"),
      })
    ).min(1, "You must provide at least one item to reorder"),
  }),
});
