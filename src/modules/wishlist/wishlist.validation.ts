import { z } from "zod";

export const wishlistItemSchema = z.object({
  body: z.object({
    productId: z.string({ required_error: "Product ID is required" }).min(1, "Product ID cannot be empty"),
  }),
});
