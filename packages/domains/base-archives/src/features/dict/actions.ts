"use server";

import { revalidatePath } from "next/cache";
import { defineServerAction } from "@base/shared";
import { StandardAction } from "@base/authorization";
import {
	assertBaseArchivesAbility,
	getTenantBaseArchivesContext,
} from "../../assembly/context";
import { TenantDictItemAction, TenantDictItemSubject } from "./contract";
import {
	parseCreateDictItemInput,
	parseUpdateDictItemInput,
	toggleDictItemStatusSchema,
} from "./schema";
import { TenantDictItemService } from "./service";
import type {
	CreateDictItemInput,
	UpdateDictItemInput,
	TenantDictItemStatus,
} from "./types";

export const createTenantDictItemAction = defineServerAction(
	async (rawInput: CreateDictItemInput) => {
		const { client, ability } = await getTenantBaseArchivesContext();
		assertBaseArchivesAbility(
			ability,
			StandardAction.CREATE,
			TenantDictItemSubject,
		);

		const input = parseCreateDictItemInput(rawInput);
		const created = await TenantDictItemService.createDictItem(client, input);

		revalidatePath("/settings/dict");
		return created;
	},
	"创建字典项失败",
);

export const updateTenantDictItemAction = defineServerAction(
	async (rawInput: UpdateDictItemInput) => {
		const { client, ability } = await getTenantBaseArchivesContext();
		assertBaseArchivesAbility(
			ability,
			StandardAction.UPDATE,
			TenantDictItemSubject,
		);

		const input = parseUpdateDictItemInput(rawInput);
		const updated = await TenantDictItemService.updateDictItem(client, input);

		revalidatePath("/settings/dict");
		return updated;
	},
	"修改字典项失败",
);

export const deleteTenantDictItemAction = defineServerAction(
	async (id: string) => {
		const { client, ability } = await getTenantBaseArchivesContext();
		assertBaseArchivesAbility(
			ability,
			StandardAction.DELETE,
			TenantDictItemSubject,
		);

		await TenantDictItemService.deleteDictItem(client, id);

		revalidatePath("/settings/dict");
		return { success: true };
	},
	"删除字典项失败",
);

export const toggleTenantDictItemStatusAction = defineServerAction(
	async (raw: { id: string; status: TenantDictItemStatus }) => {
		const { client, ability } = await getTenantBaseArchivesContext();
		assertBaseArchivesAbility(
			ability,
			TenantDictItemAction.TOGGLE_STATUS,
			TenantDictItemSubject,
		);

		const parsed = toggleDictItemStatusSchema.parse(raw);
		await TenantDictItemService.toggleStatus(
			client,
			parsed.id,
			parsed.status as TenantDictItemStatus,
		);

		revalidatePath("/settings/dict");
		return { success: true };
	},
	"切换字典项状态失败",
);
