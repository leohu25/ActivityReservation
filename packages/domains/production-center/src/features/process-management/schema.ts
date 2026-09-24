import { z } from "@base/ui";
import { processingSpecificationSchema } from "./specification/schema";
import type {
	CreateOperationInput,
	UpdateOperationInput,
} from "./types";

export * from "./specification/schema";

export const createOperationSchema = z
	.object({
		code: z
			.string()
			.trim()
			.min(1, "工序编码不能为空")
			.max(64, "工序编码最多64字符"),
		name: z
			.string()
			.trim()
			.min(1, "工序名称不能为空")
			.max(128, "工序名称最多128字符"),
		operationCategoryDictItemId: z
			.string()
			.min(1, "请选择工序分类"),
		defaultSetupMinutes: z.coerce.number().int().min(0, "准备时间不能为负数").default(0),
		defaultCleanupMinutes: z.coerce.number().int().min(0, "清理时间不能为负数").default(0),
		defaultYieldRate: z.preprocess(
			(val) => {
				if (val === "" || val === null || val === undefined) return null;
				const num = Number(val);
				return Number.isNaN(num) ? null : num;
			},
			z
				.number()
				.min(0, "出成率不能小于0")
				.max(100, "出成率不能大于100%")
				.optional()
				.nullable(),
		),
		minimumOperatorCount: z.preprocess(
			(val) => {
				if (val === "" || val === null || val === undefined) return null;
				const num = Number(val);
				return Number.isNaN(num) ? null : num;
			},
			z.number().int().min(1, "最少操作人数至少为1人").optional().nullable(),
		),
		minimumBatchQuantity: z.preprocess(
			(val) => {
				if (val === "" || val === null || val === undefined) return null;
				const num = Number(val);
				return Number.isNaN(num) ? null : num;
			},
			z.number().positive("最小批量必须大于0").optional().nullable(),
		),
		minimumBatchUnitId: z.preprocess(
			(val) => (val === "" ? null : val),
			z.string().optional().nullable(),
		),
		sopText: z.string().trim().max(4000, "SOP说明最多4000字符").optional().nullable(),
		status: z.enum(["ACTIVE", "DISABLED"]).default("ACTIVE"),
		specifications: z.array(processingSpecificationSchema).default([]),
	})
	.refine(
		(data) => {
			const codes = data.specifications.map((s) => s.code.toUpperCase());
			const uniqueCodes = new Set(codes);
			return uniqueCodes.size === codes.length;
		},
		{
			message: "工艺规格明细表中规格编码不能重复",
			path: ["specifications"],
		},
	);

export const updateOperationSchema = z
	.object({
		code: z.string().trim().min(1, "工序编码不能为空").max(64).optional(),
		name: z.string().trim().min(1, "工序名称不能为空").max(128).optional(),
		operationCategoryDictItemId: z.string().min(1, "请选择工序分类").optional(),
		defaultSetupMinutes: z.coerce.number().int().min(0).optional(),
		defaultCleanupMinutes: z.coerce.number().int().min(0).optional(),
		defaultYieldRate: z.preprocess(
			(val) => {
				if (val === "" || val === null || val === undefined) return null;
				const num = Number(val);
				return Number.isNaN(num) ? null : num;
			},
			z.number().min(0).max(100).optional().nullable(),
		),
		minimumOperatorCount: z.preprocess(
			(val) => {
				if (val === "" || val === null || val === undefined) return null;
				const num = Number(val);
				return Number.isNaN(num) ? null : num;
			},
			z.number().int().min(1).optional().nullable(),
		),
		minimumBatchQuantity: z.preprocess(
			(val) => {
				if (val === "" || val === null || val === undefined) return null;
				const num = Number(val);
				return Number.isNaN(num) ? null : num;
			},
			z.number().positive().optional().nullable(),
		),
		minimumBatchUnitId: z.preprocess(
			(val) => (val === "" ? null : val),
			z.string().optional().nullable(),
		),
		sopText: z.string().trim().max(4000).optional().nullable(),
		status: z.enum(["ACTIVE", "DISABLED"]).optional(),
		specifications: z.array(processingSpecificationSchema).optional(),
	})
	.refine(
		(data) => {
			if (!data.specifications) return true;
			const codes = data.specifications.map((s) => s.code.toUpperCase());
			const uniqueCodes = new Set(codes);
			return uniqueCodes.size === codes.length;
		},
		{
			message: "工艺规格明细表中规格编码不能重复",
			path: ["specifications"],
		},
	);

export type CreateOperationSchema = z.infer<typeof createOperationSchema>;
export type UpdateOperationSchema = z.infer<typeof updateOperationSchema>;

export function parseCreateOperationInput(raw: unknown): CreateOperationInput {
	const parsed = createOperationSchema.parse(raw);
	return {
		code: parsed.code,
		name: parsed.name,
		operationCategoryDictItemId: parsed.operationCategoryDictItemId,
		defaultSetupMinutes: parsed.defaultSetupMinutes,
		defaultCleanupMinutes: parsed.defaultCleanupMinutes,
		defaultYieldRate:
			parsed.defaultYieldRate !== null && parsed.defaultYieldRate !== undefined
				? parsed.defaultYieldRate / 100 // 转换为 0-1 小数存库
				: null,
		minimumOperatorCount: parsed.minimumOperatorCount ?? null,
		minimumBatchQuantity: parsed.minimumBatchQuantity ?? null,
		minimumBatchUnitId: parsed.minimumBatchUnitId ?? null,
		sopText: parsed.sopText || null,
		status: parsed.status,
		specifications: parsed.specifications.map((s) => ({
			id: s.id ?? null,
			code: s.code,
			name: s.name,
			description: s.description || null,
			defaultYieldRate:
				s.defaultYieldRate !== null && s.defaultYieldRate !== undefined
					? s.defaultYieldRate / 100
					: null,
			status: s.status,
		})),
	};
}

export function parseUpdateOperationInput(raw: unknown): UpdateOperationInput {
	const parsed = updateOperationSchema.parse(raw);
	let parsedDefaultYieldRate: number | null | undefined = undefined;
	if (parsed.defaultYieldRate !== undefined) {
		parsedDefaultYieldRate =
			parsed.defaultYieldRate !== null ? parsed.defaultYieldRate / 100 : null;
	}
	return {
		code: parsed.code,
		name: parsed.name,
		operationCategoryDictItemId: parsed.operationCategoryDictItemId,
		defaultSetupMinutes: parsed.defaultSetupMinutes,
		defaultCleanupMinutes: parsed.defaultCleanupMinutes,
		defaultYieldRate: parsedDefaultYieldRate,
		minimumOperatorCount: parsed.minimumOperatorCount,
		minimumBatchQuantity: parsed.minimumBatchQuantity,
		minimumBatchUnitId: parsed.minimumBatchUnitId,
		sopText: parsed.sopText === undefined ? undefined : parsed.sopText || null,
		status: parsed.status,
		specifications: parsed.specifications?.map((s) => ({
			id: s.id ?? null,
			code: s.code,
			name: s.name,
			description: s.description || null,
			defaultYieldRate:
				s.defaultYieldRate !== null && s.defaultYieldRate !== undefined
					? s.defaultYieldRate / 100
					: null,
			status: s.status,
		})),
	};
}
