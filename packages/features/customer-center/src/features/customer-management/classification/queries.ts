import "server-only";

import { toPlainData } from "@chenrun/shared";
import {
  assertCustomerAbility,
  getTenantCustomerContext,
} from "../../../assembly/context";
import { CustomerCategorySubject, CustomerTagSubject } from "./contract";
import { CustomerCategoryTagService } from "./service";

export async function getCategoryTreeQuery() {
  const { client, ability } = await getTenantCustomerContext();
  assertCustomerAbility(ability, "read", CustomerCategorySubject);
  return toPlainData(await CustomerCategoryTagService.getCategoryTree(client));
}

export async function listTagsQuery(tagType?: string) {
  const { client, ability } = await getTenantCustomerContext();
  assertCustomerAbility(ability, "read", CustomerTagSubject);
  return toPlainData(
    await CustomerCategoryTagService.listTags(client, tagType),
  );
}
