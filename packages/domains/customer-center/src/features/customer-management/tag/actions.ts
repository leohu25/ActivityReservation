"use server";

import { revalidatePath } from "next/cache";
import { defineServerAction } from "@base/shared";
import { StandardAction } from "@base/authorization";
import {
	assertCustomerAbility,
	getTenantCustomerContext,
} from "../../../assembly/context";
import { CustomerTagAction, CustomerTagSubject } from "./contract";
import { parseCreateTagInput, parseUpdateTagInput } from "./schema";
import { CustomerTagService } from "./service";
import type {
	CreateTagInput,
	UpdateTagInput,
	CustomerTagStatus,
} from "./types";

export const createTagAction = defineServerAction(
	async (rawInput: CreateTagInput) => {
		const { client, ability, userId, employeeProfile } =
			await getTenantCustomerContext();
		assertCustomerAbility(ability, StandardAction.CREATE, CustomerTagSubject);

		const input = parseCreateTagInput(rawInput);
		const created = await CustomerTagService.createTag(client, input, {
			userId,
			deptId: employeeProfile?.departmentId ?? null,
		});

		revalidatePath("/customer/tags");
		revalidatePath("/customer/customers");
		return created;
	},
	"创建业务标签失败",
);

export const updateTagAction = defineServerAction(
	async (id: string, rawInput: UpdateTagInput) => {
		const { client, ability, userId, employeeProfile } =
			await getTenantCustomerContext();
		assertCustomerAbility(ability, StandardAction.UPDATE, CustomerTagSubject);

		const input = parseUpdateTagInput(rawInput);
		const updated = await CustomerTagService.updateTag(client, id, input, {
			userId,
			deptId: employeeProfile?.departmentId ?? null,
		});

		revalidatePath("/customer/tags");
		revalidatePath("/customer/customers");
		return updated;
	},
	"修改业务标签失败",
);

export const deleteTagAction = defineServerAction(async (id: string) => {
	const { client, ability, userId, employeeProfile } =
		await getTenantCustomerContext();
	assertCustomerAbility(ability, StandardAction.DELETE, CustomerTagSubject);

	const deleted = await CustomerTagService.deleteTag(client, id, {
		userId,
		deptId: employeeProfile?.departmentId ?? null,
	});

	revalidatePath("/customer/tags");
	revalidatePath("/customer/customers");
	return deleted;
}, "删除业务标签失败");

export const updateTagStatusAction = defineServerAction(
	async (id: string, status: CustomerTagStatus) => {
		const { client, ability, userId } = await getTenantCustomerContext();
		assertCustomerAbility(
			ability,
			CustomerTagAction.TOGGLE_STATUS,
			CustomerTagSubject,
		);

		const updated = await CustomerTagService.updateTagStatus(
			client,
			id,
			status,
			{ userId },
		);

		revalidatePath("/customer/tags");
		revalidatePath("/customer/customers");
		return updated;
	},
	"变更标签状态失败",
);
