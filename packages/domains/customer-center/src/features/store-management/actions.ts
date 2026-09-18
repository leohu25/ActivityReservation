"use server";
import { StandardAction } from "@base/authorization";

import { revalidatePath } from "next/cache";
import { defineServerAction } from "@base/shared";
import {
	assertCustomerAbility,
	getTenantCustomerContext,
} from "../../assembly/context";
import { CustomerStoreSubject } from "./contract";
import { CustomerStoreService } from "./service";
import { parseCreateStoreInput, parseUpdateStoreInput } from "./schema";

export const createStoreAction = defineServerAction(
	async (raw: unknown) => {
		const { client, ability, userId, employeeProfile } =
			await getTenantCustomerContext();
		assertCustomerAbility(ability, StandardAction.CREATE, CustomerStoreSubject);
		const input = parseCreateStoreInput(raw);
		const created = await CustomerStoreService.createStore(client, input, {
			userId,
			deptId: employeeProfile?.departmentId ?? null,
		});
		revalidatePath("/customer/stores");
		revalidatePath("/customer/customers");
		return created;
	},
	"创建门店失败",
);

export const updateStoreAction = defineServerAction(
	async (id: string, raw: unknown) => {
		const { client, ability, userId } = await getTenantCustomerContext();
		assertCustomerAbility(ability, StandardAction.UPDATE, CustomerStoreSubject);
		const input = parseUpdateStoreInput(raw);
		const updated = await CustomerStoreService.updateStore(client, id, input, {
			userId,
		});
		revalidatePath("/customer/stores");
		return updated;
	},
	"更新门店失败",
);

export const updateStoreStatusAction = defineServerAction(
	async (id: string, status: "ACTIVE" | "DISABLED") => {
		const { client, ability, userId } = await getTenantCustomerContext();
		assertCustomerAbility(ability, StandardAction.UPDATE, CustomerStoreSubject);
		const updated = await CustomerStoreService.updateStoreStatus(
			client,
			id,
			status,
			{ userId },
		);
		revalidatePath("/customer/stores");
		return updated;
	},
	"更新门店状态失败",
);

export const deleteStoreAction = defineServerAction(async (id: string) => {
	const { client, ability, userId } = await getTenantCustomerContext();
	assertCustomerAbility(ability, StandardAction.DELETE, CustomerStoreSubject);
	const deleted = await CustomerStoreService.deleteStore(client, id, {
		userId,
	});
	revalidatePath("/customer/stores");
	return deleted;
}, "删除门店失败");
