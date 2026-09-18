import { z } from "@base/ui";
import type { CreateQuoteInput, UpdateQuoteInput } from "./types";

export const createQuoteItemSchema = z.object({
	itemCode: z.string().min(1, "商品编码不能为空"),
	itemName: z.string().min(1, "商品名称不能为空"),
	salesUnit: z.string().min(1, "单位不能为空"),
	unitPriceExclTax: z.number().nonnegative("单价必须为非负数"),
	unitPriceInclTax: z.number().nonnegative("含税单价必须为非负数"),
	taxRate: z.number().nonnegative("税率必须为非负数"),
	minQty: z.number().nullable().optional(),
	maxQty: z.number().nullable().optional(),
	remark: z.string().nullable().optional(),
});

export const createQuoteSchema = z.object({
	customerId: z.string().nullable().optional(),
	storeId: z.string().nullable().optional(),
	regionCode: z.string().nullable().optional(),
	quoteDate: z.string().min(1, "报价日期不能为空"),
	effectiveDate: z.string().min(1, "生效日期不能为空"),
	expiryDate: z.string().nullable().optional(),
	quoteType: z.enum(["STANDARD", "CYCLE"]).optional(),
	displayName: z.string().nullable().optional(),
	createdBy: z.string().default("系统操作员"),
	items: z.array(createQuoteItemSchema).min(1, "报价单明细至少需要一行商品"),
});

export const updateQuoteSchema = z.object({
	customerId: z.string().nullable().optional(),
	storeId: z.string().nullable().optional(),
	regionCode: z.string().nullable().optional(),
	effectiveDate: z.string().min(1, "生效日期不能为空"),
	expiryDate: z.string().nullable().optional(),
	displayName: z.string().nullable().optional(),
	items: z.array(createQuoteItemSchema).min(1, "报价单明细至少需要一行商品"),
});

export type CreateQuoteSchema = z.infer<typeof createQuoteSchema>;
export type UpdateQuoteSchema = z.infer<typeof updateQuoteSchema>;

export function parseCreateQuoteInput(raw: unknown): CreateQuoteInput {
	return createQuoteSchema.parse(raw);
}

export function parseUpdateQuoteInput(raw: unknown): UpdateQuoteInput {
	return updateQuoteSchema.parse(raw);
}
