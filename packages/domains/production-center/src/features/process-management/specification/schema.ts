import { z } from "@base/ui";

export const processingSpecificationSchema = z.object({
	id: z.string().optional().nullable(),
	code: z
		.string()
		.trim()
		.min(1, "规格编码不能为空")
		.max(64, "规格编码最多64字符"),
	name: z
		.string()
		.trim()
		.min(1, "规格名称不能为空")
		.max(128, "规格名称最多128字符"),
	description: z
		.string()
		.trim()
		.max(1000, "加工说明最多1000字符")
		.optional()
		.nullable(),
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
	status: z.enum(["ACTIVE", "DISABLED"]).default("ACTIVE"),
});

export type ProcessingSpecificationSchema = z.infer<
	typeof processingSpecificationSchema
>;
