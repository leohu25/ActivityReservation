import "server-only";
import { cache } from "react";
import { StandardAction } from "@base/authorization";

import { getAccessibleWhere, pickReadableFields } from "@base/authorization";
import { toPlainData } from "@base/shared";
import {
	assertCustomerAbility,
	getTenantCustomerContext,
} from "../../assembly/context";
import { CustomerStoreSubject } from "./contract";
import { CustomerStoreService } from "./service";
import type { ListStoreFilter, StoreListItem } from "./types";

export interface StorePageOptions {
	customerOptions: Array<{ id: string; name: string; status: string }>;
}

export const getStorePageOptionsQuery = cache(
	async (): Promise<StorePageOptions> => {
		const { client, ability } = await getTenantCustomerContext();
		assertCustomerAbility(ability, StandardAction.READ, CustomerStoreSubject);
		const customers = await client.customer.findMany({
			where: { isDeleted: false, status: "ACTIVE" },
			select: {
				id: true,
				name: true,
				status: true,
			},
			orderBy: { name: "asc" },
		});
		return toPlainData({
			customerOptions: customers,
		});
	},
);

export async function listStoresQuery(filter: ListStoreFilter = {}) {
	const { client, ability } = await getTenantCustomerContext();
	assertCustomerAbility(ability, StandardAction.READ, CustomerStoreSubject);
	const accessibleWhere = getAccessibleWhere(
		ability,
		CustomerStoreSubject,
		"read",
	);
	const result = await CustomerStoreService.listStores(
		client,
		filter,
		accessibleWhere,
	);
	const items: StoreListItem[] = result.items.map((item) => {
		const readable = pickReadableFields(
			ability,
			CustomerStoreSubject,
			item as Record<string, unknown>,
		);
		return {
			...readable,
			id: item.id,
			name: item.name,
			customerId: item.customerId,
			customer: item.customer,
		} as StoreListItem;
	});
	return toPlainData({ ...result, items });
}

export async function getStoreQuery(id: string) {
	const { client, ability } = await getTenantCustomerContext();
	assertCustomerAbility(ability, StandardAction.READ, CustomerStoreSubject);
	const accessibleWhere = getAccessibleWhere(
		ability,
		CustomerStoreSubject,
		"read",
	);
	const store = await CustomerStoreService.getStore(
		client,
		id,
		accessibleWhere,
	);
	if (!store) return null;

	const readable = pickReadableFields(
		ability,
		CustomerStoreSubject,
		store as Record<string, unknown>,
	);
	return toPlainData({
		...readable,
		id: store.id,
		customer: store.customer,
		quotes: store.quotes,
	});
}
