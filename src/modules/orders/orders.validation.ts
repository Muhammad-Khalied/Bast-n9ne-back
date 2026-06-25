import { z } from "zod";

export const orderCreateSchema = z.object({
  body: z.object({
    addressId: z.string({ required_error: "Shipping address is required" }).min(1, "Please select a shipping address"),
    notes: z.string().max(500, "Notes cannot exceed 500 characters").optional(),
    paymentMethod: z.enum(["CASH_ON_DELIVERY", "INSTAPAY_WALLET"], { required_error: "Payment method is required", invalid_type_error: "Invalid payment method" }).optional(),
    paymentReceiptUrl: z.string().optional(),
  }),
});

export const orderStatusSchema = z.object({
  body: z.object({
    status: z.enum(["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"], { invalid_type_error: "Invalid order status" }).optional(),
    paymentStatus: z.enum(["PENDING", "COMPLETED", "FAILED", "REFUNDED", "COLLECTED"], { invalid_type_error: "Invalid payment status" }).optional(),
  }),
});
