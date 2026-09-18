"use server";

import { revalidatePath } from "next/cache";
import { defineServerAction } from "@base/shared";
import { StandardAction } from "@base/authorization";
import {
	assertCustomerAbility,
	getTenantCustomerContext,
} from "../../../assembly/context";
import { CustomerCategorySubject } from "./contract";
import { parseCreateCategoryInput, parseUpdateCategoryInput } from "./schema";
import { CustomerCategoryService } from "./service";
import type {
	CreateCategoryInput,
	UpdateCategoryInput,
	CustomerCategoryStatus,
} from "./types";

export const createCategoryAction = defineServerAction(
	async (rawInput: CreateCategoryInput) => {
		const { client, ability, userId, employeeProfile } =
			await getTenantCustomerContext();
		assertCustomerAbility(
			ability,
			StandardAction.CREATE,
			CustomerCategorySubject,
		);

		const input = parseCreateCategoryInput(rawInput);
		const created = await CustomerCategoryService.createCategory(
			client,
			input,
			{
				userId,
				deptId: employeeProfile?.departmentId ?? null,
			},
		);

		revalidatePath("/customer/categories");
		revalidatePath("/customer/customers");
		return created;
	},
	"创建客户分类失败",
);

export const updateCategoryAction = defineServerAction(
	async (id: string, rawInput: UpdateCategoryInput) => {
		const { client, ability, userId, employeeProfile } =
			await getTenantCustomerContext();
		assertCustomerAbility(
			ability,
			StandardAction.UPDATE,
			CustomerCategorySubject,
		);

		const input = parseUpdateCategoryInput(rawInput);
		const updated = await CustomerCategoryService.updateCategory(
			client,
			id,
			input,
			{
				userId,
				deptId: employeeProfile?.departmentId ?? null,
			},
		);

		revalidatePath("/customer/categories");
		revalidatePath("/customer/customers");
		return updated;
	},
	"修改客户分类失败",
);

export const deleteCategoryAction = defineServerAction(async (id: string) => {
	const { client, ability, userId, employeeProfile } =
		await getTenantCustomerContext();
	assertCustomerAbility(
		ability,
		StandardAction.DELETE,
		CustomerCategorySubject,
	);

	const deleted = await CustomerCategoryService.deleteCategory(client, id, {
		userId,
		deptId: employeeProfile?.departmentId ?? null,
	});

	revalidatePath("/customer/categories");
	revalidatePath("/customer/customers");
	return deleted;
}, "删除客户分类失败");

export const updateCategoryStatusAction = defineServerAction(
	async (id: string, status: CustomerCategoryStatus) => {
		const { client, ability, userId } = await getTenantCustomerContext();
		assertCustomerAbility(
			ability,
			StandardAction.UPDATE,
			CustomerCategorySubject,
		);

		const updated = await CustomerCategoryService.updateCategoryStatus(
			client,
			id,
			status,
			{ userId },
		);

		revalidatePath("/customer/categories");
		revalidatePath("/customer/customers");
		return updated;
	},
	"变更分类状态失败",
);
