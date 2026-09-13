import "server-only";

import { getAccessibleWhere, pickReadableFields } from "@base/authorization";
import { toPlainData } from "@base/shared";
import {
  assertCustomerAbility,
  getTenantCustomerContext,
} from "../../assembly/context";
import { CustomerStoreSubject } from "./contract";
import { CustomerStoreService } from "./service";
import type { ListStoreFilter, StoreListItem } from "./types";

export async function listStoresQuery(filter: ListStoreFilter = {}) {
  const { client, ability } = await getTenantCustomerContext();
  assertCustomerAbility(ability, "read", CustomerStoreSubject);
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
      id: item.storeCode,
      storeCode: item.storeCode,
      customer: item.customer,
    } as StoreListItem;
  });
  return toPlainData({ ...result, items });
}

export async function getStoreQuery(storeCode: string) {
  const { client, ability } = await getTenantCustomerContext();
  assertCustomerAbility(ability, "read", CustomerStoreSubject);
  const accessibleWhere = getAccessibleWhere(
    ability,
    CustomerStoreSubject,
    "read",
  );
  const store = await CustomerStoreService.getStore(
    client,
    storeCode,
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
    id: store.storeCode,
    storeCode: store.storeCode,
    customer: store.customer,
    quotes: store.quotes,
  });
}
