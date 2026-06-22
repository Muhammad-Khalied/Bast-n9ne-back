import { z } from "zod";

export const categoryCreateSchema = z.object({
  body: z.object({
    name: z.string({ required_error: "Category name is required" }).min(1, "Category name cannot be empty"),
    slug: z.string({ required_error: "Category slug is required" }).min(1, "Category slug cannot be empty"),
    description: z.string().optional().nullable(),
    parentId: z.string().optional().nullable(),
    isActive: z.boolean().optional(),
    sortOrder: z.number().optional(),
    image: z.string().optional().nullable(),
  }),
});

export const categoryUpdateSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Category name cannot be empty").optional(),
    slug: z.string().min(1, "Category slug cannot be empty").optional(),
    description: z.string().optional().nullable(),
    parentId: z.string().optional().nullable(),
    isActive: z.boolean().optional(),
    sortOrder: z.number().optional(),
    image: z.string().optional().nullable(),
  }),
});
