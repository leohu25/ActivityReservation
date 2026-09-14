import "server-only";
import { StandardAction } from "@base/authorization";

import { getAccessibleWhere, pickReadableFields } from "@base/authorization";
import {
  assertCustomerAbility,
  getTenantCustomerContext,
} from "../../assembly/context";
import { CustomerSubject } from "./contract";
import { CustomerService } from "./service";
import { CustomerCategoryTagService } from "./classification/service";
import type { CustomerListItem, ListCustomerFilter } from "./types";
import type {
  CustomerCategoryItem,
  CustomerTagItem,
} from "./classification/types";
import { toPlainData } from "@base/shared";

export interface CustomerPageOptions {
  categoryOptions: CustomerCategoryItem[];
  tagOptions: CustomerTagItem[];
}

/**
 * 获取客户档案页面所需的全量下拉选项元数据（宿主聚合 BFF 模式）
 * 遵循工业级 DDD 与 App Router 规范：校验宿主 CustomerSubject 读权限，
 * 一次性聚合当前租户所有处于 ACTIVE 状态的可用分类与标签，
 * 消除子模块后台权限变动波及主业务页面的级联瘫痪隐患。
 */
export async function getCustomerPageOptionsQuery(): Promise<CustomerPageOptions> {
  const { client, ability } = await getTenantCustomerContext();
  assertCustomerAbility(ability, StandardAction.READ, CustomerSubject);

  const [categoryOptions, tagOptions] = await Promise.all([
    CustomerCategoryTagService.listCategories(client, { status: "ACTIVE" }),
    CustomerCategoryTagService.listTags(client, { status: "ACTIVE" }),
  ]);

  return toPlainData({
    categoryOptions,
    tagOptions,
  });
}

export async function listCustomersQuery(filter: ListCustomerFilter = {}) {
  const { client, ability } = await getTenantCustomerContext();
  assertCustomerAbility(ability, StandardAction.READ, CustomerSubject);
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
