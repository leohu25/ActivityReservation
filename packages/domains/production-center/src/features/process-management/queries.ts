import "server-only";
import { cache } from "react";
import { StandardAction, getAccessibleWhere } from "@base/authorization";
import { toPlainData } from "@base/shared";
import {
	assertProductionCenterAbility,
	getTenantProductionCenterContext,
} from "../../assembly/context";
import { OperationSubject } from "./contract";
import { OperationService } from "./service";
import type {
	ListOperationsFilter,
	OperationDetail,
	OperationFormOptions,
	OperationListItem,
} from "./types";

/**
 * 工序/工艺主数据分页列表查询（RSC page.tsx 直通）
 */
export async function listOperationsQuery(
	filter: ListOperationsFilter = {},
): Promise<{
	items: OperationListItem[];
	total: number;
	page: number;
	pageSize: number;
}> {
	const { client, ability } = await getTenantProductionCenterContext();
	assertProductionCenterAbility(ability, StandardAction.READ, OperationSubject);

	const accessibleWhere = getAccessibleWhere(
		ability,
		OperationSubject,
		StandardAction.READ,
	);

	const result = await OperationService.listPaged(
		client,
		filter,
		accessibleWhere,
	);
	return toPlainData(result);
}

/**
 * 工序详情查询（含关联的工艺规格明细）
 */
export async function getOperationDetailQuery(
	id: string,
): Promise<OperationDetail | null> {
	const { client, ability } = await getTenantProductionCenterContext();
	assertProductionCenterAbility(ability, StandardAction.READ, OperationSubject);

	const detail = await OperationService.getById(client, id);
	return detail ? toPlainData(detail) : null;
}

/**
 * 获取表单所需的分类与单位选项 (支持请求级记忆化 cache)
 */
export const getOperationFormOptionsQuery = cache(
	async (): Promise<OperationFormOptions> => {
		const { client } = await getTenantProductionCenterContext();
		const options = await OperationService.getFormOptions(client);
		return toPlainData(options);
	},
);
