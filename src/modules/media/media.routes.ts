import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { upload } from "../../middleware/upload";
import { validate } from "../../middleware/validate";
import { uploadLimiter } from "../../middleware/rateLimiter";
import { uploadMedia, deleteMedia, reorderMedia, uploadReceipt } from "./media.controller";
import { reorderMediaSchema } from "./media.validation";

export const mediaRoutes = Router();

mediaRoutes.post("/upload", authenticate, authorize("ADMIN"), uploadLimiter, upload.single("file"), uploadMedia);
mediaRoutes.post("/receipt", authenticate, uploadLimiter, upload.single("file"), uploadReceipt);
mediaRoutes.delete("/:id", authenticate, authorize("ADMIN"), deleteMedia);
mediaRoutes.patch("/reorder", authenticate, authorize("ADMIN"), validate(reorderMediaSchema), reorderMedia);
