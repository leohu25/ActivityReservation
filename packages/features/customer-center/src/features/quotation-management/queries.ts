import "server-only";

import { pickReadableFields } from "@base/authorization";
import { toPlainData } from "@base/shared";
import {
  assertCustomerAbility,
  getTenantCustomerContext,
} from "../../assembly/context";
import { CustomerQuoteSubject } from "./contract";
import { CustomerQuoteService } from "./service";
import type { ListQuoteFilter, QuoteListItem } from "./types";

export async function listQuotesQuery(filter: ListQuoteFilter = {}) {
  const { client, ability } = await getTenantCustomerContext();
  assertCustomerAbility(ability, "read", CustomerQuoteSubject);
  const result = await CustomerQuoteService.listQuotes(client, filter);
  const items: QuoteListItem[] = result.items.map((item) => {
    const readable = pickReadableFields(
      ability,
      CustomerQuoteSubject,
      item as Record<string, unknown>,
    );
    return {
      ...readable,
      id: item.quoteId,
      quoteId: item.quoteId,
    } as QuoteListItem;
  });
  return toPlainData({ ...result, items });
}
