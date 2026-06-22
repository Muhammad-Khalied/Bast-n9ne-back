import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { validate } from "../../middleware/validate";
import { addWishlistItem, getWishlist, removeWishlistItem } from "./wishlist.controller";
import { wishlistItemSchema } from "./wishlist.validation";

export const wishlistRoutes = Router();

wishlistRoutes.get("/", authenticate, getWishlist);
wishlistRoutes.post("/items", authenticate, validate(wishlistItemSchema), addWishlistItem);
wishlistRoutes.delete("/items/:productId", authenticate, removeWishlistItem);
