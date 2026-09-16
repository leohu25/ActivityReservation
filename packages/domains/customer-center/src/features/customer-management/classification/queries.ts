import "server-only";
import { StandardAction } from "@base/authorization";

import { toPlainData } from "@base/shared";
import {
  assertCustomerAbility,
  getTenantCustomerContext,
} from "../../../assembly/context";
import { CustomerCategorySubject, CustomerTagSubject } from "./contract";
import { CustomerCategoryTagService } from "./service";
import type { CustomerCategoryItem, CustomerTagItem } from "./types";

export interface CategoriesTagsPageData {
  readonly categories: CustomerCategoryItem[] | null;
  readonly tags: CustomerTagItem[] | null;
  readonly canReadCategory: boolean;
  readonly canReadTag: boolean;
}

/**
 * 复合页面聚合安全读取：分类与标签同页展示
 * 遵循 Fail-Closed：若用户两者均无权限，严格抛出 ForbiddenError；
 * 若具备其一，则按权只读并行加载对应实体数据，无权实体优雅回退为 null，绝不触发白屏崩溃。
 */
export async function getCategoriesTagsPageDataQuery(): Promise<CategoriesTagsPageData> {
  const { client, ability } = await getTenantCustomerContext();
  const canReadCategory = ability.can(
    StandardAction.READ,
    CustomerCategorySubject,
  );
  const canReadTag = ability.can(StandardAction.READ, CustomerTagSubject);

  if (!canReadCategory && !canReadTag) {
    assertCustomerAbility(
      ability,
      StandardAction.READ,
      CustomerCategorySubject,
    );
  }

  const [categories, tags] = await Promise.all([
    canReadCategory
      ? toPlainData(await CustomerCategoryTagService.getCategoryTree(client))
      : Promise.resolve(null),
    canReadTag
      ? toPlainData(await CustomerCategoryTagService.listTags(client))
      : Promise.resolve(null),
  ]);

  return {
    categories,
    tags,
    canReadCategory,
    canReadTag,
  };
}

/**
 * 获取完整分类树（分类管理后台专用）
 * 严格受控：必须具备 CustomerCategory 独立资源管理/查看权限
 */
export async function getCategoryTreeQuery() {
  const { client, ability } = await getTenantCustomerContext();
  assertCustomerAbility(ability, StandardAction.READ, CustomerCategorySubject);
  return toPlainData(await CustomerCategoryTagService.getCategoryTree(client));
}

/**
 * 获取完整标签列表（标签管理后台专用）
 * 严格受控：必须具备 CustomerTag 独立资源管理/查看权限
 */
export async function listTagsQuery(tagType?: string) {
  const { client, ability } = await getTenantCustomerContext();
  assertCustomerAbility(ability, StandardAction.READ, CustomerTagSubject);
  return toPlainData(
    await CustomerCategoryTagService.listTags(client, { tagType }),
  );
}
