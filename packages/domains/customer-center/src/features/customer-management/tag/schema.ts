import { z } from "@base/ui";
import type { CreateTagInput, UpdateTagInput } from "./types";

export const createTagSchema = z.object({
	tagCode: z.string().optional(),
	tagName: z.string().min(1, "标签名称不能为空"),
	tagType: z.string().min(1, "请选择标签类型"),
	description: z.string().nullable().optional(),
});

export const updateTagSchema = createTagSchema.partial().extend({
	status: z.enum(["ACTIVE", "DISABLED"]).optional(),
});

export type CreateTagSchema = z.infer<typeof createTagSchema>;
export type UpdateTagSchema = z.infer<typeof updateTagSchema>;

export function parseCreateTagInput(raw: unknown): CreateTagInput {
	const parsed = createTagSchema.parse(raw);
	return {
		tagCode: parsed.tagCode,
		tagName: parsed.tagName,
		tagType: parsed.tagType,
		description: parsed.description || null,
	};
}

export function parseUpdateTagInput(raw: unknown): UpdateTagInput {
	const parsed = updateTagSchema.parse(raw);
	return {
		tagName: parsed.tagName ?? "",
		tagType: parsed.tagType ?? "",
		description:
			parsed.description === undefined ? undefined : parsed.description || null,
		status: parsed.status,
	};
}
