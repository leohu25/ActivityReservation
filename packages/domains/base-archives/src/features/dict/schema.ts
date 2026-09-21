import { z } from "@base/ui";
import type { CreateDictItemInput, UpdateDictItemInput } from "./types";

export const createDictItemSchema = z.object({
	type: z
		.string({ message: "字典类型不能为空" })
		.min(1, "字典类型不能为空")
		.max(50, "字典类型不能超过50字符"),
	code: z
		.string({ message: "字典项编码不能为空" })
		.min(1, "字典项编码不能为空")
		.max(50, "字典项编码不能超过50字符")
		.regex(/^[A-Za-z0-9_.-]+$/, "编码仅允许字母、数字、下划线、点与短横线"),
	name: z
		.string({ message: "字典项名称不能为空" })
		.min(1, "字典项名称不能为空")
		.max(100, "字典项名称不能超过100字符"),
	status: z.enum(["ACTIVE", "DISABLED"]).default("ACTIVE"),
	sort: z.coerce.number().int().default(0),
	isDefault: z.boolean().default(false),
	remark: z.string().max(255, "备注不能超过255字符").nullish(),
});

export const updateDictItemSchema = z.object({
	id: z.string().min(1, "ID 不能为空"),
	name: z
		.string()
		.min(1, "字典项名称不能为空")
		.max(100, "字典项名称不能超过100字符")
		.optional(),
	status: z.enum(["ACTIVE", "DISABLED"]).optional(),
	sort: z.coerce.number().int().optional(),
	isDefault: z.boolean().optional(),
	remark: z.string().max(255, "备注不能超过255字符").nullish(),
});

export const toggleDictItemStatusSchema = z.object({
	id: z.string().min(1, "ID 不能为空"),
	status: z.enum(["ACTIVE", "DISABLED"]),
});

export type CreateDictItemSchema = z.infer<typeof createDictItemSchema>;
export type UpdateDictItemSchema = z.infer<typeof updateDictItemSchema>;

export function parseCreateDictItemInput(raw: unknown): CreateDictItemInput {
	const parsed = createDictItemSchema.parse(raw);
	return {
		type: parsed.type,
		code: parsed.code,
		name: parsed.name,
		status: parsed.status,
		sort: parsed.sort,
		isDefault: parsed.isDefault,
		remark: parsed.remark || null,
	};
}

export function parseUpdateDictItemInput(raw: unknown): UpdateDictItemInput {
	const parsed = updateDictItemSchema.parse(raw);
	return {
		id: parsed.id,
		name: parsed.name,
		status: parsed.status,
		sort: parsed.sort,
		isDefault: parsed.isDefault,
		remark: parsed.remark === undefined ? undefined : parsed.remark || null,
	};
}
