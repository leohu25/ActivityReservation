import "server-only";
import { cache } from "react";
import { StandardAction } from "@base/authorization";

import { getAccessibleWhere, pickReadableFields } from "@base/authorization";
import {
	assertCustomerAbility,
	getTenantCustomerContext,
} from "../../assembly/context";
import { CustomerSubject } from "./contract";
import { CustomerService } from "./service";
import { CustomerCategoryService } from "./category/service";
import { CustomerTagService } from "./tag/service";
import type {
	CustomerListItem,
	ListCustomerFilter,
	CustomerPageOptions,
} from "./types";
import { toPlainData, MasterDataStatus } from "@base/shared";

export type { CustomerPageOptions };

/**
 * 下拉选项 BFF：React.cache 请求级去重。
 * RSC 只允许把 **resolve 后的纯数据** 传给 Client，禁止透传 Promise prop。
 */
export const getCustomerPageOptionsQuery = cache(
	async (): Promise<CustomerPageOptions> => {
		const { client, ability } = await getTenantCustomerContext();
		assertCustomerAbility(ability, StandardAction.READ, CustomerSubject);

		const [categoryOptions, tagOptions] = await Promise.all([
			CustomerCategoryService.listCategories(client, {
				status: MasterDataStatus.ACTIVE,
			}),
			CustomerTagService.listTags(client, {
				status: MasterDataStatus.ACTIVE,
			}),
		]);

		return toPlainData({
			categoryOptions,
			tagOptions,
		});
	},
);

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
			id: item.id,
			...readable,
		} as unknown as CustomerListItem;
	});

	return toPlainData({ ...result, items });
}

/** 获取客户档案详情 Server Query（React.cache 请求级去重） */
export const getCustomerDetailQuery = cache(async (id: string) => {
	const { client, ability } = await getTenantCustomerContext();
	assertCustomerAbility(ability, StandardAction.READ, CustomerSubject);

	const customer = await CustomerService.getCustomer(client, id);
	if (!customer) return null;

	const readable = pickReadableFields(
		ability,
		CustomerSubject,
		customer as Record<string, unknown>,
	);

	// 组装标签与门店汇总信息
	const tagIds = customer.tagAssignments?.map((t) => t.tagId) || [];
	const customerTags =
		customer.tagAssignments?.map((t) => t.tag.name).join(", ") || "";

	return toPlainData({
		...customer,
		...readable,
		id: customer.id,
		tagIds,
		customerTags,
	});
});

/** 获取客户档案总数 Server Query (受控于 Customer 实体读权限与数据范围下推) */
export async function getCustomerCountQuery(): Promise<number> {
	const { client, ability } = await getTenantCustomerContext();
	assertCustomerAbility(ability, StandardAction.READ, CustomerSubject);
	const accessibleWhere = getAccessibleWhere(ability, CustomerSubject, "read");
	return client.customer.count({
		where: accessibleWhere,
	});
}
