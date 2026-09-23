"use server";

import { revalidatePath } from "next/cache";
import { defineServerAction } from "@base/shared";
import {
	StandardAction,
	assertEditableFields,
} from "@base/authorization";
import {
	assertProductionCenterAbility,
	getTenantProductionCenterContext,
} from "../../assembly/context";
import { BomAction, BomSubject, BomField } from "./contract";
import { parseCreateBomInput, parseUpdateBomInput } from "./schema";
import { BomService } from "./service";
import type { CreateBomInput, UpdateBomInput } from "./types";

/**
 * 提取 BOM 核心受控字段 Payload，供服务端 CASL 物理防篡改校验
 */
function extractControlledBomPayload(
	rawInput: CreateBomInput | UpdateBomInput,
): Record<string, unknown> {
	const controlled: Record<string, unknown> = Object.create(null);
	if (rawInput.code !== undefined) controlled[BomField.CODE] = rawInput.code;
	if (rawInput.name !== undefined) controlled[BomField.NAME] = rawInput.name;
	if (rawInput.bomType !== undefined) controlled[BomField.BOM_TYPE] = rawInput.bomType;
	if (rawInput.productId !== undefined) controlled[BomField.PRODUCT_ID] = rawInput.productId;
	if (rawInput.productionLineId !== undefined) controlled[BomField.PRODUCTION_LINE_ID] = rawInput.productionLineId;
	if (rawInput.description !== undefined) controlled[BomField.DESCRIPTION] = rawInput.description;
	if (rawInput.quantityMode !== undefined) controlled[BomField.QUANTITY_MODE] = rawInput.quantityMode;
	if (rawInput.totalYieldRate !== undefined) controlled[BomField.TOTAL_YIELD_RATE] = rawInput.totalYieldRate;
	if (rawInput.defaultCookedYieldRate !== undefined) controlled[BomField.DEFAULT_COOKED_YIELD_RATE] = rawInput.defaultCookedYieldRate;
	if (rawInput.minimumBatchQuantity !== undefined) controlled[BomField.MINIMUM_BATCH_QUANTITY] = rawInput.minimumBatchQuantity;
	return controlled;
}

export const createBomAction = defineServerAction(
	async (rawInput: CreateBomInput) => {
		const { client, ability, userId, employeeProfile } =
			await getTenantProductionCenterContext();
		assertProductionCenterAbility(ability, StandardAction.CREATE, BomSubject);

		// SAFETY: ability 由 getTenantProductionCenterContext 生成，符合 CASL MongoAbility 规则校验接口
		assertEditableFields(
			ability as unknown as Parameters<typeof assertEditableFields>[0],
			BomSubject,
			extractControlledBomPayload(rawInput),
		);

		const input = parseCreateBomInput(rawInput);
		const created = await BomService.createBom(client, input, {
			userId,
			deptId: employeeProfile?.departmentId ?? null,
		});

		revalidatePath("/production/bom");
		return created;
	},
	"新建生产BOM失败",
);

export const updateBomAction = defineServerAction(
	async (bomId: string, rawInput: UpdateBomInput) => {
		const { client, ability, userId, employeeProfile } =
			await getTenantProductionCenterContext();
		assertProductionCenterAbility(ability, StandardAction.UPDATE, BomSubject);

		// SAFETY: ability 由 getTenantProductionCenterContext 生成，符合 CASL MongoAbility 规则校验接口
		assertEditableFields(
			ability as unknown as Parameters<typeof assertEditableFields>[0],
			BomSubject,
			extractControlledBomPayload(rawInput),
		);

		const input = parseUpdateBomInput(rawInput);
		const updated = await BomService.updateBom(client, bomId, input, {
			userId,
			deptId: employeeProfile?.departmentId ?? null,
		});

		revalidatePath("/production/bom");
		return updated;
	},
	"更新生产BOM失败",
);

export const deleteBomAction = defineServerAction(
	async (bomId: string) => {
		const { client, ability, userId, employeeProfile } =
			await getTenantProductionCenterContext();
		assertProductionCenterAbility(ability, StandardAction.DELETE, BomSubject);

		await BomService.deleteBom(client, bomId, {
			userId,
			deptId: employeeProfile?.departmentId ?? null,
		});

		revalidatePath("/production/bom");
		return { success: true };
	},
	"删除生产BOM失败",
);

export const setDefaultBomAction = defineServerAction(
	async (productId: string, bomId: string) => {
		const { client, ability, userId, employeeProfile } =
			await getTenantProductionCenterContext();
		assertProductionCenterAbility(ability, BomAction.SET_DEFAULT, BomSubject);

		await BomService.setDefaultBom(client, productId, bomId, {
			userId,
			deptId: employeeProfile?.departmentId ?? null,
		});

		revalidatePath("/production/bom");
		return { success: true };
	},
	"设置默认BOM失败",
);

export const getBomDetailAction = defineServerAction(
	async (bomId: string, versionNumber?: number) => {
		const { client, ability } = await getTenantProductionCenterContext();
		assertProductionCenterAbility(ability, StandardAction.READ, BomSubject);

		const detail = await BomService.getBomDetail(client, bomId, versionNumber);
		return detail;
	},
	"获取生产BOM详情失败",
);

export const publishBomVersionAction = defineServerAction(
	async (bomId: string, versionNumber: number) => {
		const { client, ability, userId, employeeProfile } =
			await getTenantProductionCenterContext();
		assertProductionCenterAbility(ability, BomAction.PUBLISH, BomSubject);

		await BomService.publishBomVersion(client, bomId, versionNumber, {
			userId,
			deptId: employeeProfile?.departmentId ?? null,
		});

		revalidatePath("/production/bom");
		return { success: true };
	},
	"发布生产BOM版本失败",
);


