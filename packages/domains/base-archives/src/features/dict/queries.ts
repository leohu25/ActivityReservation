import "server-only";
import { cache } from "react";
import { StandardAction } from "@base/authorization";
import { toPlainData } from "@base/shared";
import {
	assertBaseArchivesAbility,
	getTenantBaseArchivesContext,
} from "../../assembly/context";
import { TenantDictItemSubject } from "./contract";
import { TenantDictItemService } from "./service";
import type {
	TenantDictItemDto,
	TenantDictItemStatus,
	DictOption,
} from "./types";

export interface ListDictItemsFilter {
	page?: number;
	pageSize?: number;
	keyword?: string;
	type?: string;
	status?: TenantDictItemStatus;
}

/**
 * 字典项分页列表查询（供标准 RSC page.tsx 消费）
 */
export async function listTenantDictItemsQuery(
	filter: ListDictItemsFilter = {},
): Promise<{
	items: TenantDictItemDto[];
	total: number;
	page: number;
	pageSize: number;
}> {
	const { client, ability } = await getTenantBaseArchivesContext();
	assertBaseArchivesAbility(
		ability,
		StandardAction.READ,
		TenantDictItemSubject,
	);
	return toPlainData(
		await TenantDictItemService.listDictItemsPaged(client, filter),
	);
}

/**
 * 下拉选项专用查询（缓存按 type 查询 ACTIVE 状态的选项，供全系统任意业务切片安全消费）
 * React.cache() 确保同一次请求内相同 type 的字典查询只执行一次 DB 读取
 */
export const getDictOptionsByTypeQuery = cache(
	async (type: string): Promise<DictOption[]> => {
		const { client } = await getTenantBaseArchivesContext();
		return toPlainData(
			await TenantDictItemService.getDictOptionsByType(client, type, {
				onlyActive: true,
			}),
		);
	},
);
