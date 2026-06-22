import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import {
  createCategory,
  deleteCategory,
  getAdminCategory,
  getCategory,
  listAdminCategories,
  listCategories,
  updateCategory,
} from "./categories.controller";
import { categoryCreateSchema, categoryUpdateSchema } from "./categories.validation";

export const categoriesRoutes = Router();
export const adminCategoriesRoutes = Router();

categoriesRoutes.get("/", listCategories);
categoriesRoutes.get("/:slug", getCategory);

categoriesRoutes.post("/", authenticate, authorize("ADMIN"), validate(categoryCreateSchema), createCategory);
categoriesRoutes.patch("/:id", authenticate, authorize("ADMIN"), validate(categoryUpdateSchema), updateCategory);
categoriesRoutes.delete("/:id", authenticate, authorize("ADMIN"), deleteCategory);

adminCategoriesRoutes.get("/", authenticate, authorize("ADMIN"), listAdminCategories);
adminCategoriesRoutes.get("/:id", authenticate, authorize("ADMIN"), getAdminCategory);
adminCategoriesRoutes.post("/", authenticate, authorize("ADMIN"), validate(categoryCreateSchema), createCategory);
adminCategoriesRoutes.patch("/:id", authenticate, authorize("ADMIN"), validate(categoryUpdateSchema), updateCategory);
adminCategoriesRoutes.delete("/:id", authenticate, authorize("ADMIN"), deleteCategory);
