import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import {
  createProduct,
  deleteProduct,
  getBestSellers,
  getFeatured,
  getNewArrivals,
  getProduct,
  getRelated,
  getAdminProduct,
  listAdminProducts,
  listProducts,
  updateProduct,
} from "./products.controller";
import { productCreateSchema, productUpdateSchema } from "./products.validation";

export const productsRoutes = Router();
export const adminProductsRoutes = Router();

productsRoutes.get("/", listProducts);
productsRoutes.get("/featured", getFeatured);
productsRoutes.get("/new-arrivals", getNewArrivals);
productsRoutes.get("/best-sellers", getBestSellers);
productsRoutes.get("/:slug/related", getRelated);
productsRoutes.get("/:slug", getProduct);

productsRoutes.post("/", authenticate, authorize("ADMIN"), validate(productCreateSchema), createProduct);
productsRoutes.patch("/:id", authenticate, authorize("ADMIN"), validate(productUpdateSchema), updateProduct);
productsRoutes.delete("/:id", authenticate, authorize("ADMIN"), deleteProduct);

adminProductsRoutes.get("/", authenticate, authorize("ADMIN"), listAdminProducts);
adminProductsRoutes.get("/:id", authenticate, authorize("ADMIN"), getAdminProduct);
adminProductsRoutes.post("/", authenticate, authorize("ADMIN"), validate(productCreateSchema), createProduct);
adminProductsRoutes.patch("/:id", authenticate, authorize("ADMIN"), validate(productUpdateSchema), updateProduct);
adminProductsRoutes.delete("/:id", authenticate, authorize("ADMIN"), deleteProduct);
