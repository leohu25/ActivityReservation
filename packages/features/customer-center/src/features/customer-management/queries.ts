import "server-only";

import { getAccessibleWhere, pickReadableFields } from "@chenrun/authorization";
import {
  assertCustomerAbility,
  getTenantCustomerContext,
} from "../../assembly/context";
import { CustomerSubject } from "./contract";
import { CustomerService } from "./service";
import type { CustomerListItem, ListCustomerFilter } from "./types";
import { toPlainData } from "@chenrun/shared";

export async function listCustomersQuery(filter: ListCustomerFilter = {}) {
  const { client, ability } = await getTenantCustomerContext();
  assertCustomerAbility(ability, "read", CustomerSubject);
  const accessibleWhere = getAccessibleWhere(ability, CustomerSubject, "read");
  const result = await CustomerService.listCustomers(
    client,
    filter,
    accessibleWhere,
  );
  const items: CustomerListItem[] = result.items.map((item) => {
    const readable = pickReadableFields(
      ability,
      CustomerSubject,
      item as Record<string, unknown>,
    );
    // SAFETY: readable 由 pickReadableFields 按 CASL 授权裁剪，在此附加上层实体唯一标识 id 后映射为展示模型
    return {
      id: item.customerCode,
      ...readable,
    } as unknown as CustomerListItem;
  });

  return toPlainData({ ...result, items });
}
