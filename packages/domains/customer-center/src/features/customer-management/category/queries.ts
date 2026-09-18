import "server-only";
import { cache } from "react";
import { StandardAction } from "@base/authorization";
import { MasterDataStatus, toPlainData } from "@base/shared";
import {
	assertCustomerAbility,
	getTenantCustomerContext,
} from "../../../assembly/context";
import { CustomerCategorySubject } from "./contract";
import { CustomerCategoryService } from "./service";
import type { CustomerCategoryItem, CustomerCategoryStatus } from "./types";

export interface ListCategoriesFilter {
	page?: number;
	pageSize?: number;
	keyword?: string;
	status?: CustomerCategoryStatus;
}

/**
 * 分类分页列表查询（供标准 RSC page.tsx 消费）
 */
export async function listCategoriesQuery(
	filter: ListCategoriesFilter = {},
): Promise<{
	items: CustomerCategoryItem[];
	total: number;
	page: number;
	pageSize: number;
}> {
	const { client, ability } = await getTenantCustomerContext();
	assertCustomerAbility(ability, StandardAction.READ, CustomerCategorySubject);
	return toPlainData(
		await CustomerCategoryService.listCategoriesPaged(client, filter),
	);
}

/**
 * 获取完整分类树（分类树展示专用）
 */
export async function getCategoryTreeQuery(): Promise<CustomerCategoryItem[]> {
	const { client, ability } = await getTenantCustomerContext();
	assertCustomerAbility(ability, StandardAction.READ, CustomerCategorySubject);
	return toPlainData(await CustomerCategoryService.getCategoryTree(client));
}

/**
 * 下拉选项专用查询（仅查 ACTIVE 状态，与管理后台权限解耦，防级联瘫痪）
 */
export const getCustomerCategoryOptionsQuery = cache(
	async (): Promise<CustomerCategoryItem[]> => {
		const { client } = await getTenantCustomerContext();
		return toPlainData(
			await CustomerCategoryService.listCategories(client, {
				status: MasterDataStatus.ACTIVE,
			}),
		);
	},
);
