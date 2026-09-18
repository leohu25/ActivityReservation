"use server";

import { revalidatePath } from "next/cache";
import { defineServerAction } from "@base/shared";
import { StandardAction } from "@base/authorization";
import {
	assertCustomerAbility,
	getTenantCustomerContext,
} from "../../assembly/context";
import { CustomerAction, CustomerSubject } from "./contract";
import { parseCreateCustomerInput, parseUpdateCustomerInput } from "./schema";
import { CustomerService } from "./service";
import type {
	CreateCustomerInput,
	CustomerStatus,
	UpdateCustomerInput,
} from "./types";

export const createCustomerAction = defineServerAction(
	async (rawInput: CreateCustomerInput) => {
		const { client, ability, userId, employeeProfile } =
			await getTenantCustomerContext();
		assertCustomerAbility(ability, StandardAction.CREATE, CustomerSubject);

		const input = parseCreateCustomerInput(rawInput);
		const created = await CustomerService.createCustomer(client, input, {
			userId,
			deptId: employeeProfile?.departmentId ?? null,
		});

		revalidatePath("/customer/customers");
		return created;
	},
	"创建客户失败",
);

export const updateCustomerAction = defineServerAction(
	async (id: string, rawInput: UpdateCustomerInput) => {
		const { client, ability, userId } = await getTenantCustomerContext();
		assertCustomerAbility(ability, StandardAction.UPDATE, CustomerSubject);

		const input = parseUpdateCustomerInput(rawInput);
		const updated = await CustomerService.updateCustomer(client, id, input, {
			userId,
		});

		revalidatePath("/customer/customers");
		return updated;
	},
	"更新客户失败",
);

export const deleteCustomerAction = defineServerAction(async (id: string) => {
	const { client, ability, userId } = await getTenantCustomerContext();
	assertCustomerAbility(ability, StandardAction.DELETE, CustomerSubject);

	const deleted = await CustomerService.deleteCustomer(client, id, {
		userId,
	});

	revalidatePath("/customer/customers");
	return deleted;
}, "删除客户失败");

export const updateCustomerStatusAction = defineServerAction(
	async (id: string, status: CustomerStatus) => {
		const { client, ability, userId } = await getTenantCustomerContext();
		assertCustomerAbility(
			ability,
			CustomerAction.TOGGLE_STATUS,
			CustomerSubject,
		);

		const updated = await CustomerService.updateCustomerStatus(
			client,
			id,
			status,
			{ userId },
		);

		revalidatePath("/customer/customers");
		revalidatePath("/customer/stores");
		return updated;
	},
	"更新客户状态失败",
);
