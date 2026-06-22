import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import {
  getOverview,
  getSales,
  getProductPerformance,
  getCategoryPerformance,
  getOrderStatusBreakdown,
} from "./analytics.controller";

export const analyticsRoutes = Router();

analyticsRoutes.get("/overview", authenticate, authorize("ADMIN"), getOverview);
analyticsRoutes.get("/sales", authenticate, authorize("ADMIN"), getSales);
analyticsRoutes.get("/products", authenticate, authorize("ADMIN"), getProductPerformance);
analyticsRoutes.get("/categories", authenticate, authorize("ADMIN"), getCategoryPerformance);
analyticsRoutes.get("/orders", authenticate, authorize("ADMIN"), getOrderStatusBreakdown);
