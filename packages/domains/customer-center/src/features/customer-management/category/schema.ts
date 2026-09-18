import { z } from "@base/ui";
import type { CreateCategoryInput, UpdateCategoryInput } from "./types";

export const createCategorySchema = z.object({
	name: z.string().min(1, "分类名称不能为空"),
	parentId: z.string().nullable().optional(),
	description: z.string().nullable().optional(),
});

export const updateCategorySchema = createCategorySchema.partial().extend({
	status: z.enum(["ACTIVE", "DISABLED"]).optional(),
});

export type CreateCategorySchema = z.infer<typeof createCategorySchema>;
export type UpdateCategorySchema = z.infer<typeof updateCategorySchema>;

export function parseCreateCategoryInput(raw: unknown): CreateCategoryInput {
	const parsed = createCategorySchema.parse(raw);
	return {
		name: parsed.name,
		parentId: parsed.parentId || null,
		description: parsed.description || null,
	};
}

export function parseUpdateCategoryInput(raw: unknown): UpdateCategoryInput {
	const parsed = updateCategorySchema.parse(raw);
	return {
		name: parsed.name,
		parentId:
			parsed.parentId === undefined ? undefined : parsed.parentId || null,
		description:
			parsed.description === undefined ? undefined : parsed.description || null,
		status: parsed.status,
	};
}
