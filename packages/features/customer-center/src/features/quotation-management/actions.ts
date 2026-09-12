"use server";

import { revalidatePath } from "next/cache";
import { defineServerAction } from "@chenrun/shared";
import {
  assertCustomerAbility,
  getTenantCustomerContext,
} from "../../assembly/context";
import { CustomerQuoteSubject } from "./contract";
import { CustomerQuoteService } from "./service";
import type { CreateQuoteInput } from "./types";

export const createQuoteAction = defineServerAction(
  async (input: CreateQuoteInput) => {
    const { client, ability } = await getTenantCustomerContext();
    assertCustomerAbility(ability, "create", CustomerQuoteSubject);
    const created = await CustomerQuoteService.createQuote(client, input);
    revalidatePath("/customer/quotes");
    return created;
  },
  "创建报价单失败",
);

export const updateQuoteStatusAction = defineServerAction(
  async (quoteId: string, status: "ACTIVE" | "VOIDED") => {
    const { client, ability } = await getTenantCustomerContext();
    assertCustomerAbility(ability, "update", CustomerQuoteSubject);
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
