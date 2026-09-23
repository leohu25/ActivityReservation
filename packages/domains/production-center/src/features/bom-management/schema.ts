import { z } from "@base/ui";
import {
	BOM_TYPES,
	QUANTITY_MODES,
	MATERIAL_ROLES,
	OUTPUT_ROLES,
	SUPPLY_POLICIES,
} from "./contract";
import type { CreateBomInput, UpdateBomInput } from "./types";

export const bomInputItemSchema = z.object({
	productId: z.string({ message: "投入物料商品不能为空" }).min(1),
	quantity: z.coerce.number().min(0.000001, "毛投入量必须大于0").nullish(),
	unitId: z.string({ message: "投入单位不能为空" }).min(1),
	ratio: z.coerce.number().min(0).max(1).nullish(),
	materialRole: z
		.enum([
			MATERIAL_ROLES.MAIN,
			MATERIAL_ROLES.AUXILIARY,
			MATERIAL_ROLES.PACKAGING,
			MATERIAL_ROLES.PROCESSING_AID,
		])
		.default(MATERIAL_ROLES.MAIN),
	cookedYieldRate: z.coerce.number().min(0).max(1).nullish(),
	normalLossRate: z.coerce.number().min(0).max(1).nullish(),
	supplyPolicy: z
		.enum([
			SUPPLY_POLICIES.EXTERNAL,
			SUPPLY_POLICIES.MAKE,
			SUPPLY_POLICIES.PRODUCT_DEFAULT,
		])
		.default(SUPPLY_POLICIES.EXTERNAL),
	childBomId: z.string().nullish(),
	sortOrder: z.coerce.number().int().default(0),
	remark: z.string().max(255).nullish(),
});

export const bomOutputItemSchema = z.object({
	productId: z.string({ message: "产出物料商品不能为空" }).min(1),
	quantity: z.coerce.number().min(0.000001, "产出数量必须大于0").default(1),
	unitId: z.string({ message: "产出单位不能为空" }).min(1),
	outputRole: z
		.enum([OUTPUT_ROLES.PRIMARY, OUTPUT_ROLES.BYPRODUCT])
		.default(OUTPUT_ROLES.PRIMARY),
	costAllocationRatio: z.coerce.number().min(0).max(1).nullish(),
	sortOrder: z.coerce.number().int().default(0),
	remark: z.string().max(255).nullish(),
});

export const bomOperationItemSchema = z.object({
	operationId: z.string({ message: "工序不能为空" }).min(1),
	processingSpecificationId: z.string().nullish(),
	sequenceNumber: z.coerce.number().int().default(10),
	setupMinutes: z.coerce.number().int().min(0).nullish(),
	cleanupMinutes: z.coerce.number().int().min(0).nullish(),
	standardLaborHours: z.coerce.number().min(0).nullish(),
	qualityCheckpoint: z.boolean().default(false),
	instructionText: z.string().nullish(),
	instructionParameters: z.record(z.string(), z.unknown()).nullish(),
	sortOrder: z.coerce.number().int().default(0),
	remark: z.string().max(255).nullish(),
});

export const createBomSchema = z.object({
	bomType: z.enum([
		BOM_TYPES.PROCESSING,
		BOM_TYPES.FORMULA,
		BOM_TYPES.PACKAGING,
	]),
	code: z
		.string({ message: "BOM编码不能为空" })
		.min(1, "BOM编码不能为空")
		.max(64, "BOM编码不能超过64字符"),
	name: z
		.string({ message: "BOM名称不能为空" })
		.min(1, "BOM名称不能为空")
		.max(128, "BOM名称不能超过128字符"),
	productId: z.string({ message: "BOM商品不能为空" }).min(1),
	productionLineId: z.string().nullish(),
	description: z.string().max(1000).nullish(),
	quantityMode: z
		.enum([QUANTITY_MODES.FIXED, QUANTITY_MODES.RATIO])
		.default(QUANTITY_MODES.FIXED),
	totalYieldEnabled: z.boolean().default(false),
	totalYieldRate: z.coerce.number().min(0).max(1).nullish(),
	defaultCookedYieldRate: z.coerce.number().min(0).max(1).nullish(),
	minimumBatchQuantity: z.coerce.number().min(0).nullish(),
	isDefault: z.boolean().default(false),
	isDraft: z.boolean().default(false),
	inputs: z.array(bomInputItemSchema).default([]),
	outputs: z.array(bomOutputItemSchema).default([]),
	operations: z.array(bomOperationItemSchema).default([]),
});

export const updateBomSchema = createBomSchema.partial().extend({
	changeReason: z.string().max(500).nullish(),
});

export function parseCreateBomInput(raw: unknown): CreateBomInput {
	return createBomSchema.parse(raw);
}

export function parseUpdateBomInput(raw: unknown): UpdateBomInput {
	return updateBomSchema.parse(raw);
}
