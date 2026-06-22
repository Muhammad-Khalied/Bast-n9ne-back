import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { upload } from "../../middleware/upload";
import { validate } from "../../middleware/validate";
import { uploadMedia, deleteMedia, reorderMedia, uploadReceipt } from "./media.controller";
import { reorderMediaSchema } from "./media.validation";

export const mediaRoutes = Router();

mediaRoutes.post("/upload", authenticate, authorize("ADMIN"), upload.single("file"), uploadMedia);
mediaRoutes.post("/receipt", authenticate, upload.single("file"), uploadReceipt);
mediaRoutes.delete("/:id", authenticate, authorize("ADMIN"), deleteMedia);
mediaRoutes.patch("/reorder", authenticate, authorize("ADMIN"), validate(reorderMediaSchema), reorderMedia);
