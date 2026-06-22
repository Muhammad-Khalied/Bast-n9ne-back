import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { validate } from "../../middleware/validate";
import {
  addCartItem,
  clearCart,
  getCart,
  removeCartItem,
  updateCartItem,
} from "./cart.controller";
import { cartItemCreateSchema, cartItemUpdateSchema } from "./cart.validation";

export const cartRoutes = Router();

cartRoutes.get("/", authenticate, getCart);
cartRoutes.post("/items", authenticate, validate(cartItemCreateSchema), addCartItem);
cartRoutes.patch("/items/:id", authenticate, validate(cartItemUpdateSchema), updateCartItem);
cartRoutes.delete("/items/:id", authenticate, removeCartItem);
cartRoutes.delete("/", authenticate, clearCart);
