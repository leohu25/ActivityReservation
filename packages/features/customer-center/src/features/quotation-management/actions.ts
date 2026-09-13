"use server";
import { StandardAction } from "@base/authorization";

import { revalidatePath } from "next/cache";
import { defineServerAction } from "@base/shared";
import {
  assertCustomerAbility,
  getTenantCustomerContext,
} from "../../assembly/context";
import { CustomerQuoteSubject } from "./contract";
import { CustomerQuoteService } from "./service";
import type { CreateQuoteInput, UpdateQuoteInput } from "./types";

export const createQuoteAction = defineServerAction(
  async (input: CreateQuoteInput) => {
    const { client, ability, userId, employeeProfile } =
      await getTenantCustomerContext();
    assertCustomerAbility(ability, StandardAction.CREATE, CustomerQuoteSubject);
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
  async (quoteId: string, input: UpdateQuoteInput) => {
    const { client, ability, userId } = await getTenantCustomerContext();
    assertCustomerAbility(ability, StandardAction.UPDATE, CustomerQuoteSubject);
    const updated = await CustomerQuoteService.updateQuote(
      client,
      quoteId,
      input,
      { userId },
    );
    revalidatePath("/customer/quotes");
    return updated;
  },
  "修改报价单失败",
);

export const deleteQuoteAction = defineServerAction(async (quoteId: string) => {
  const { client, ability, userId } = await getTenantCustomerContext();
  assertCustomerAbility(ability, StandardAction.DELETE, CustomerQuoteSubject);
  const deleted = await CustomerQuoteService.deleteQuote(client, quoteId, {
    userId,
  });
  revalidatePath("/customer/quotes");
  return deleted;
}, "删除报价单失败");

export const updateQuoteStatusAction = defineServerAction(
  async (quoteId: string, status: "ACTIVE" | "VOIDED") => {
    const { client, ability } = await getTenantCustomerContext();
    // 审核生效走 audit 动作契约；作废走 update 动作契约
    const requiredAction = status === "ACTIVE" ? "audit" : "update";
    assertCustomerAbility(ability, requiredAction, CustomerQuoteSubject);
    const updated = await CustomerQuoteService.updateQuoteStatus(
      client,
      quoteId,
      status,
    );
    revalidatePath("/customer/quotes");
    return updated;
  },
  "更新报价单状态失败",
);
