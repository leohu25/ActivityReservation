"use server";

import { revalidatePath } from "next/cache";
import { defineServerAction } from "@base/shared";
import { StandardAction } from "@base/authorization";
import {
	assertProductionCenterAbility,
	getTenantProductionCenterContext,
} from "../../assembly/context";
import { BomAction, BomSubject } from "./contract";
import { parseCreateBomInput, parseUpdateBomInput } from "./schema";
import { BomService } from "./service";
import type { CreateBomInput, UpdateBomInput } from "./types";

export const createBomAction = defineServerAction(
	async (rawInput: CreateBomInput) => {
		const { client, ability, userId, employeeProfile } =
			await getTenantProductionCenterContext();
		assertProductionCenterAbility(ability, StandardAction.CREATE, BomSubject);

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
