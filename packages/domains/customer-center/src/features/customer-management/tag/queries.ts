import "server-only";
import { cache } from "react";
import { StandardAction } from "@base/authorization";
import { MasterDataStatus, toPlainData } from "@base/shared";
import {
	assertCustomerAbility,
	getTenantCustomerContext,
} from "../../../assembly/context";
import { CustomerTagSubject } from "./contract";
import { CustomerTagService } from "./service";
import type { CustomerTagItem, CustomerTagStatus } from "./types";

export interface ListTagsFilter {
	page?: number;
	pageSize?: number;
	keyword?: string;
	tagTypeId?: string;
	tagType?: string; // 兼容别名
	status?: CustomerTagStatus;
}

/**
 * 标签分页列表查询（供标准 RSC page.tsx 消费）
 */
export async function listTagsQuery(
	filterOrTagType?: string | ListTagsFilter,
): Promise<{
	items: CustomerTagItem[];
	total: number;
	page: number;
	pageSize: number;
}> {
	const { client, ability } = await getTenantCustomerContext();
	assertCustomerAbility(ability, StandardAction.READ, CustomerTagSubject);
	let filter: ListTagsFilter;
	if (typeof filterOrTagType === "string") {
		filter = { tagTypeId: filterOrTagType };
	} else if (filterOrTagType) {
		filter = {
			...filterOrTagType,
			tagTypeId: filterOrTagType.tagTypeId ?? filterOrTagType.tagType,
		};
	} else {
		filter = {};
	}
	return toPlainData(await CustomerTagService.listTagsPaged(client, filter));
}

/**
 * 下拉选项专用查询（仅查 ACTIVE 状态，与管理后台权限解耦）
 */
export const getCustomerTagOptionsQuery = cache(
	async (): Promise<CustomerTagItem[]> => {
		const { client } = await getTenantCustomerContext();
		return toPlainData(
			await CustomerTagService.listTags(client, {
				status: MasterDataStatus.ACTIVE,
			}),
		);
	},
);
