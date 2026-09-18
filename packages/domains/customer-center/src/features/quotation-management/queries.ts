import "server-only";
import { cache } from "react";
import { StandardAction } from "@base/authorization";

import { getAccessibleWhere, pickReadableFields } from "@base/authorization";
import { toPlainData } from "@base/shared";
import {
	assertCustomerAbility,
	getTenantCustomerContext,
} from "../../assembly/context";
import { CustomerQuoteSubject } from "./contract";
import { CustomerQuoteService } from "./service";
import type { ListQuoteFilter, QuoteListItem } from "./types";

export interface QuotePageOptions {
	customerOptions: Array<{ id: string; name: string }>;
	storeOptions: Array<{ id: string; name: string; customerId: string }>;
}

export const getQuotePageOptionsQuery = cache(
	async (): Promise<QuotePageOptions> => {
		const { client, ability } = await getTenantCustomerContext();
		assertCustomerAbility(ability, StandardAction.READ, CustomerQuoteSubject);
		const [customers, stores] = await Promise.all([
			client.customer.findMany({
				where: { isDeleted: false, status: "ACTIVE" },
				select: { id: true, name: true },
				orderBy: { name: "asc" },
			}),
			client.customerStore.findMany({
				where: { isDeleted: false, status: "ACTIVE" },
				select: { id: true, name: true, customerId: true },
				orderBy: { name: "asc" },
			}),
		]);
		return toPlainData({
			customerOptions: customers,
			storeOptions: stores,
		});
	},
);

export async function listQuotesQuery(filter: ListQuoteFilter = {}) {
	const { client, ability } = await getTenantCustomerContext();
	assertCustomerAbility(ability, StandardAction.READ, CustomerQuoteSubject);
	const accessibleWhere = getAccessibleWhere(
		ability,
		CustomerQuoteSubject,
		"read",
	);
	const result = await CustomerQuoteService.listQuotes(
		client,
		filter,
		accessibleWhere,
	);
	const items: QuoteListItem[] = result.items.map((item) => {
		const readable = pickReadableFields(
			ability,
			CustomerQuoteSubject,
			item as Record<string, unknown>,
		);
		return {
			...readable,
			id: item.id,
			quoteNo: item.quoteNo,
		} as QuoteListItem;
	});
	return toPlainData({ ...result, items });
}
