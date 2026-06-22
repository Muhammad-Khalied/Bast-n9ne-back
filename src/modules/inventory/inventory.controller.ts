import { Request, Response } from "express";
import { InventoryService } from "./inventory.service";
import { catchAsync } from "../../utils/catchAsync";

const service = new InventoryService();

export const listInventory = catchAsync(async (_req: Request, res: Response) => {
  const data = await service.list();
  res.status(200).json({ success: true, data });
});

export const adjustInventory = catchAsync(async (req: Request, res: Response) => {
  const data = await service.adjust(
    req.body.variantId,
    req.body.quantity,
    req.body.reason,
    req.body.reference,
    req.user?.id
  );
  res.status(200).json({ success: true, data });
});
