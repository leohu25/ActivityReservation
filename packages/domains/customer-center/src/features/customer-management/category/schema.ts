import { z } from "@base/ui";
import type { CreateCategoryInput, UpdateCategoryInput } from "./types";

export const createCategorySchema = z.object({
	categoryCode: z.string().optional(),
	categoryName: z.string().min(1, "分类名称不能为空"),
	parentCode: z.string().nullable().optional(),
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
		categoryCode: parsed.categoryCode,
		categoryName: parsed.categoryName,
		parentCode: parsed.parentCode || null,
		description: parsed.description || null,
	};
}

export function parseUpdateCategoryInput(raw: unknown): UpdateCategoryInput {
	const parsed = updateCategorySchema.parse(raw);
	return {
		categoryName: parsed.categoryName ?? "",
		parentCode:
			parsed.parentCode === undefined ? undefined : parsed.parentCode || null,
		description:
			parsed.description === undefined ? undefined : parsed.description || null,
		status: parsed.status,
	};
}
