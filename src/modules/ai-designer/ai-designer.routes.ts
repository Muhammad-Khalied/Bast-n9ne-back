import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import { aiGenerateLimiter } from "../../middleware/rateLimiter";
import {
  generateDesign,
  getDesign,
  getUserDesigns,
  addToCart,
  getCustomCartItems,
  updateCustomCartItem,
  removeCustomCartItem,
  getAiSettings,
  updateAiSettings,
} from "./ai-designer.controller";
import {
  generateDesignSchema,
  addToCartSchema,
  updateCustomCartSchema,
  aiSettingsUpdateSchema,
} from "./ai-designer.validation";

export const aiDesignerRoutes = Router();
export const adminAiDesignerRoutes = Router();

// Public
aiDesignerRoutes.get("/settings", getAiSettings);

// Authenticated user routes
aiDesignerRoutes.post("/generate", authenticate, aiGenerateLimiter, validate(generateDesignSchema), generateDesign);
aiDesignerRoutes.get("/designs", authenticate, getUserDesigns);
aiDesignerRoutes.get("/designs/:id", authenticate, getDesign);
aiDesignerRoutes.post("/cart", authenticate, validate(addToCartSchema), addToCart);
aiDesignerRoutes.get("/cart", authenticate, getCustomCartItems);
aiDesignerRoutes.patch("/cart/:id", authenticate, validate(updateCustomCartSchema), updateCustomCartItem);
aiDesignerRoutes.delete("/cart/:id", authenticate, removeCustomCartItem);

// Admin routes
adminAiDesignerRoutes.patch("/settings", authenticate, authorize("ADMIN"), validate(aiSettingsUpdateSchema), updateAiSettings);
