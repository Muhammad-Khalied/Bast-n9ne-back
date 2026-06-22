import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { getSettings, updateSettings } from "./settings.controller";

export const settingsRoutes = Router();

settingsRoutes.get("/", getSettings); // Public so storefront can use it
settingsRoutes.patch("/", authenticate, authorize("ADMIN"), updateSettings);
