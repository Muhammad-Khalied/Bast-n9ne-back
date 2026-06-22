import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import { adjustInventory, listInventory } from "./inventory.controller";
import { inventoryAdjustSchema } from "./inventory.validation";

export const inventoryRoutes = Router();

inventoryRoutes.get("/", authenticate, authorize("ADMIN"), listInventory);
inventoryRoutes.post("/adjust", authenticate, authorize("ADMIN"), validate(inventoryAdjustSchema), adjustInventory);
