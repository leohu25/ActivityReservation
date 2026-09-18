import { z } from "@base/ui";
import type { CreateCustomerInput, UpdateCustomerInput } from "./types";

export const createCustomerSchema = z.object({
  customerName: z.string().min(1, "客户名称为必填项"),
  categoryCode: z.string().min(1, "请选择客户分类"),
  contactPerson: z.string().min(1, "联系人为必填项"),
  contactPhone: z
    .string()
    .min(1, "联系电话为必填项")
    .regex(/^1[3-9]\d{9}$/, "请输入合法的11位手机号码"),
  settlementMethod: z.enum(["MONTHLY", "CASH", "PREPAID"]),
  defaultTaxRate: z.number().nullable().optional(),
  creditLimit: z.number().nullable().optional(),
  tagCodes: z.array(z.string()).optional(),
  salesPerson: z.string().nullable().optional(),
  defaultWarehouse: z.string().nullable().optional(),
  paymentCycle: z.string().nullable().optional(),
  serviceTime: z.string().nullable().optional(),
});

export const updateCustomerSchema = createCustomerSchema
  .partial()
  .extend({
    status: z.enum(["ACTIVE", "DISABLED"]).optional(),
  });

export type CreateCustomerSchema = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerSchema = z.infer<typeof updateCustomerSchema>;

export function parseCreateCustomerInput(raw: unknown): CreateCustomerInput {
  return createCustomerSchema.parse(raw);
}

export function parseUpdateCustomerInput(raw: unknown): UpdateCustomerInput {
  return updateCustomerSchema.parse(raw);
}
