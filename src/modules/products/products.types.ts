import { ProductStatus } from "@prisma/client";

export interface ProductCreateInput {
  title: string;
  description: string;
  shortDescription?: string;
  price: number;
  discountPrice?: number;
  categoryId: string;
  status?: ProductStatus;
  tags?: string[];
  sizes?: string[];
  colors?: { name: string; hex: string }[];
  featured?: boolean;
  seoTitle?: string;
  seoDescription?: string;
}

export interface ProductUpdateInput extends Partial<ProductCreateInput> {}

export interface ProductListParams {
  page: number;
  perPage: number;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sizes?: string[];
  colors?: string[];
  tags?: string[];
  sort?: "price_asc" | "price_desc" | "newest" | "popular" | "name_asc";
  search?: string;
  status?: ProductStatus;
}
