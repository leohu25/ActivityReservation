import "server-only";

import { pickReadableFields } from "@chenrun/authorization";
import { toPlainData } from "@chenrun/shared";
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
  const result = await CustomerStoreService.listStores(client, filter);
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
    } as StoreListItem;
  });
  return toPlainData({ ...result, items });
}
