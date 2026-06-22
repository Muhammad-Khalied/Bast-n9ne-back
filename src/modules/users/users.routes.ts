import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import {
  addAddress,
  adminGetUser,
  adminListUsers,
  adminUpdateStatus,
  changePassword,
  getProfile,
  listAddresses,
  removeAddress,
  updateAddress,
  updateProfile,
} from "./users.controller";
import { addressSchema, passwordChangeSchema, profileUpdateSchema, userStatusSchema } from "./users.validation";

export const usersRoutes = Router();
export const adminUsersRoutes = Router();

adminUsersRoutes.get("/", authenticate, authorize("ADMIN"), adminListUsers);
adminUsersRoutes.get("/:id", authenticate, authorize("ADMIN"), adminGetUser);
adminUsersRoutes.patch("/:id/status", authenticate, authorize("ADMIN"), validate(userStatusSchema), adminUpdateStatus);

usersRoutes.get("/", authenticate, getProfile);
usersRoutes.put("/", authenticate, validate(profileUpdateSchema), updateProfile);
usersRoutes.put("/password", authenticate, validate(passwordChangeSchema), changePassword);
usersRoutes.get("/addresses", authenticate, listAddresses);
usersRoutes.post("/addresses", authenticate, validate(addressSchema), addAddress);
usersRoutes.put("/addresses/:id", authenticate, validate(addressSchema), updateAddress);
usersRoutes.delete("/addresses/:id", authenticate, removeAddress);
