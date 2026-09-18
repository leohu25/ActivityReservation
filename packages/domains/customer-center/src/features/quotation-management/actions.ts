"use server";
import { StandardAction } from "@base/authorization";

import { revalidatePath } from "next/cache";
import { defineServerAction } from "@base/shared";
import {
	assertCustomerAbility,
	getTenantCustomerContext,
} from "../../assembly/context";
import { CustomerQuoteStatus, CustomerQuoteSubject } from "./contract";
import { CustomerQuoteService } from "./service";
import { parseCreateQuoteInput, parseUpdateQuoteInput } from "./schema";

export const createQuoteAction = defineServerAction(
	async (raw: unknown) => {
		const { client, ability, userId, employeeProfile } =
			await getTenantCustomerContext();
		assertCustomerAbility(ability, StandardAction.CREATE, CustomerQuoteSubject);
		const input = parseCreateQuoteInput(raw);
		const created = await CustomerQuoteService.createQuote(client, input, {
			userId,
			deptId: employeeProfile?.departmentId ?? null,
		});
		revalidatePath("/customer/quotes");
		return created;
	},
	"创建报价单失败",
);

export const updateQuoteAction = defineServerAction(
	async (id: string, raw: unknown) => {
		const { client, ability, userId } = await getTenantCustomerContext();
		assertCustomerAbility(ability, StandardAction.UPDATE, CustomerQuoteSubject);
		const input = parseUpdateQuoteInput(raw);
		const updated = await CustomerQuoteService.updateQuote(client, id, input, {
			userId,
		});
		revalidatePath("/customer/quotes");
		return updated;
	},
	"修改报价单失败",
);

export const deleteQuoteAction = defineServerAction(async (id: string) => {
	const { client, ability, userId } = await getTenantCustomerContext();
	assertCustomerAbility(ability, StandardAction.DELETE, CustomerQuoteSubject);
	const deleted = await CustomerQuoteService.deleteQuote(client, id, {
		userId,
	});
	revalidatePath("/customer/quotes");
	return deleted;
}, "删除报价单失败");

export const updateQuoteStatusAction = defineServerAction(
	async (
		id: string,
		status:
			| typeof CustomerQuoteStatus.ACTIVE
			| typeof CustomerQuoteStatus.VOIDED,
	) => {
		const { client, ability } = await getTenantCustomerContext();
		// 审核生效走 audit 动作契约；作废走 update 动作契约
		const requiredAction =
			status === CustomerQuoteStatus.ACTIVE ? "audit" : "update";
		assertCustomerAbility(ability, requiredAction, CustomerQuoteSubject);
		const updated = await CustomerQuoteService.updateQuoteStatus(
			client,
			id,
			status,
		);
		revalidatePath("/customer/quotes");
		return updated;
	},
	"更新报价单状态失败",
);
