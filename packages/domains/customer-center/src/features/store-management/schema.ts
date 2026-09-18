import { z } from "@base/ui";
import type { CreateStoreInput, UpdateStoreInput } from "./types";

export const createStoreSchema = z.object({
	customerId: z.string().min(1, "所属客户企业为必选项"),
	name: z.string().min(1, "门店名称为必填项").max(100, "门店名称最多100个字符"),
	regionCode: z.string().min(1, "请选择所属配送区域网格"),
	deliveryPeriod: z.string().min(1, "请选择首选配送时段"),
	address: z
		.string()
		.min(1, "配送收货地址为必填项")
		.max(200, "配送收货地址最多200个字符"),
	contactPerson: z
		.string()
		.min(1, "现场联系人为必填项")
		.max(50, "现场联系人最多50个字符"),
	contactPhone: z
		.string()
		.min(1, "联系人电话为必填项")
		.regex(/^1[3-9]\d{9}$/, "请输入合法的11位手机号码"),
	defaultRoute: z.string().optional(),
	defaultDriver: z.string().optional(),
	billingContact: z.string().optional(),
	billingPhone: z
		.string()
		.optional()
		.refine(
			(val) => !val || /^1[3-9]\d{9}$/.test(val),
			"请输入合法的11位对账联系电话",
		),
});

export const updateStoreSchema = createStoreSchema.partial().extend({
	status: z.enum(["ACTIVE", "DISABLED"]).optional(),
});

export type CreateStoreSchema = z.infer<typeof createStoreSchema>;
export type UpdateStoreSchema = z.infer<typeof updateStoreSchema>;

export function parseCreateStoreInput(raw: unknown): CreateStoreInput {
	return createStoreSchema.parse(raw);
}

export function parseUpdateStoreInput(raw: unknown): UpdateStoreInput {
	return updateStoreSchema.parse(raw);
}
