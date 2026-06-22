import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import {
  createOrder,
  getAdminOrder,
  getOrder,
  listAdminOrders,
  listOrders,
  updateOrderStatus,
} from "./orders.controller";
import { orderCreateSchema, orderStatusSchema } from "./orders.validation";

export const ordersRoutes = Router();
export const adminOrdersRoutes = Router();

adminOrdersRoutes.get("/", authenticate, authorize("ADMIN"), listAdminOrders);
adminOrdersRoutes.get("/:id", authenticate, authorize("ADMIN"), getAdminOrder);
adminOrdersRoutes.patch("/:id/status", authenticate, authorize("ADMIN"), validate(orderStatusSchema), updateOrderStatus);

ordersRoutes.get("/", authenticate, listOrders);
ordersRoutes.post("/", authenticate, validate(orderCreateSchema), createOrder);
ordersRoutes.get("/:id", authenticate, getOrder);
