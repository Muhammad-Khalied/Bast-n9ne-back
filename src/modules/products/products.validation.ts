import { z } from "zod";

const colorSchema = z.object({
  name: z.string().min(1),
  hex: z.string().min(3).optional(),
});

export const productCreateSchema = z.object({
  body: z.object({
    title: z.string({ required_error: "Product title is required" }).min(1, "Product title cannot be empty"),
    description: z.string({ required_error: "Product description is required" }).min(1, "Product description cannot be empty"),
    shortDescription: z.string().optional().nullable(),
    price: z.number({ required_error: "Product price is required", invalid_type_error: "Price must be a number" }).nonnegative("Price cannot be negative"),
    discountPrice: z.number().nonnegative("Discount price cannot be negative").optional().nullable(),
    categoryId: z.string({ required_error: "Category is required" }).min(1, "Please select a category"),
    status: z.string().optional(),
    tags: z.union([z.array(z.string()), z.string()]).optional(),
    sizes: z.union([z.array(z.string()), z.string()]).optional(),
    colors: z.union([z.array(colorSchema), z.string()]).optional(),
    variants: z.any().optional(),
    featured: z.boolean().optional(),
    seoTitle: z.string().optional().nullable(),
    seoDescription: z.string().optional().nullable(),
  }),
});

export const productUpdateSchema = z.object({
  body: productCreateSchema.shape.body.partial(),
});
