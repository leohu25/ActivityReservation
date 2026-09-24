"use server";

import { revalidatePath } from "next/cache";
import { StandardAction, assertEditableFields } from "@base/authorization";
import { defineServerAction } from "@base/shared";
import {
	assertProductionCenterAbility,
	getTenantProductionCenterContext,
} from "../../assembly/context";
import {
	OperationField,
	OperationSubject,
	ProcessAction,
} from "./contract";
import {
	parseCreateOperationInput,
	parseUpdateOperationInput,
} from "./schema";
import { OperationService } from "./service";
import type {
	CreateOperationInput,
	UpdateOperationInput,
} from "./types";

function extractControlledOperationPayload(
	rawInput: Partial<CreateOperationInput | UpdateOperationInput>,
): Record<string, unknown> {
	const controlled: Record<string, unknown> = Object.create(null);
	if (rawInput.code !== undefined) controlled[OperationField.CODE] = rawInput.code;
	if (rawInput.name !== undefined) controlled[OperationField.NAME] = rawInput.name;
	if (rawInput.operationCategoryDictItemId !== undefined)
		controlled[OperationField.OPERATION_CATEGORY_DICT_ITEM_ID] =
			rawInput.operationCategoryDictItemId;
	if (rawInput.defaultSetupMinutes !== undefined)
		controlled[OperationField.DEFAULT_SETUP_MINUTES] =
			rawInput.defaultSetupMinutes;
	if (rawInput.defaultCleanupMinutes !== undefined)
		controlled[OperationField.DEFAULT_CLEANUP_MINUTES] =
			rawInput.defaultCleanupMinutes;
	if (rawInput.defaultYieldRate !== undefined)
		controlled[OperationField.DEFAULT_YIELD_RATE] = rawInput.defaultYieldRate;
	if (rawInput.minimumOperatorCount !== undefined)
		controlled[OperationField.MINIMUM_OPERATOR_COUNT] =
			rawInput.minimumOperatorCount;
	if (rawInput.minimumBatchQuantity !== undefined)
		controlled[OperationField.MINIMUM_BATCH_QUANTITY] =
			rawInput.minimumBatchQuantity;
	if (rawInput.minimumBatchUnitId !== undefined)
		controlled[OperationField.MINIMUM_BATCH_UNIT_ID] =
			rawInput.minimumBatchUnitId;
	if (rawInput.sopText !== undefined)
		controlled[OperationField.SOP_TEXT] = rawInput.sopText;
	if (rawInput.status !== undefined)
		controlled[OperationField.STATUS] = rawInput.status;
	return controlled;
}

export const createOperationAction = defineServerAction(
	async (rawInput: unknown) => {
		const { client, ability, userId, employeeProfile } =
			await getTenantProductionCenterContext();
		assertProductionCenterAbility(
			ability,
			StandardAction.CREATE,
			OperationSubject,
		);

		const input = parseCreateOperationInput(rawInput);

		// SAFETY: ability 由 getTenantProductionCenterContext 生成，符合 CASL MongoAbility 规则校验接口
		assertEditableFields(
			ability as unknown as Parameters<typeof assertEditableFields>[0],
			OperationSubject,
			extractControlledOperationPayload(input),
		);

		const created = await OperationService.create(client, input, {
			userId,
			deptId: employeeProfile?.departmentId ?? null,
		});

		revalidatePath("/production/operations");
		return created;
	},
	"新建工艺档案失败",
);

export const updateOperationAction = defineServerAction(
	async (id: string, rawInput: unknown) => {
		const { client, ability, userId, employeeProfile } =
			await getTenantProductionCenterContext();
		assertProductionCenterAbility(
			ability,
			StandardAction.UPDATE,
			OperationSubject,
		);

		const input = parseUpdateOperationInput(rawInput);

		// SAFETY: ability 由 getTenantProductionCenterContext 生成，符合 CASL MongoAbility 规则校验接口
		assertEditableFields(
			ability as unknown as Parameters<typeof assertEditableFields>[0],
			OperationSubject,
			extractControlledOperationPayload(input),
		);

		const updated = await OperationService.update(client, id, input, {
			userId,
			deptId: employeeProfile?.departmentId ?? null,
		});

		revalidatePath("/production/operations");
		return updated;
	},
	"更新工艺档案失败",
);

export const deleteOperationAction = defineServerAction(
	async (id: string) => {
		const { client, ability, userId } =
			await getTenantProductionCenterContext();
		assertProductionCenterAbility(
			ability,
			StandardAction.DELETE,
			OperationSubject,
		);

		await OperationService.delete(client, id, { userId });
		revalidatePath("/production/operations");
		return { success: true };
	},
	"删除工艺档案失败",
);

export const toggleOperationStatusAction = defineServerAction(
	async (id: string, nextStatus: "ACTIVE" | "DISABLED") => {
		const { client, ability, userId } =
			await getTenantProductionCenterContext();
		assertProductionCenterAbility(
			ability,
			ProcessAction.TOGGLE_STATUS,
			OperationSubject,
		);

		await OperationService.toggleStatus(client, id, nextStatus, { userId });
		revalidatePath("/production/operations");
		return { success: true };
	},
	"修改工艺档案状态失败",
);
