import "server-only";
import { StandardAction } from "@base/authorization";

import { toPlainData } from "@base/shared";
import {
 assertCustomerAbility,
 getTenantCustomerContext,
} from "../../../assembly/context";
import { CustomerCategorySubject, CustomerTagSubject } from "./contract";
import { CustomerCategoryTagService } from "./service";

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
