import "server-only";

import { cache } from "react";
import {
	StandardAction,
	getAccessibleWhere,
	pickReadableFields,
} from "@base/authorization";
import { toPlainData } from "@base/shared";
import {
	assertProductionCenterAbility,
	getTenantProductionCenterContext,
} from "../../assembly/context";
import { BomSubject } from "./contract";
import { BomService } from "./service";
import type { BomDetailDto, BomFormOptions, ListBomFilter, ListBomsResult, BomListItemDto } from "./types";

/**
 * 分页查询 BOM 列表 (RSC 读取，支持 Nuqs URL 过滤与 CASL 数据权限 SQL 下推)
 */
export async function listBomsQuery(
	filter: ListBomFilter = {},
): Promise<ListBomsResult> {
	const { client, ability } = await getTenantProductionCenterContext();
	assertProductionCenterAbility(ability, StandardAction.READ, BomSubject);

	// CASL 四层权限：生成当前操作人对应的行级数据权限 SQL 过滤条件 (SELF/DEPT/DEPT_TREE/ALL)
	const accessibleWhere = getAccessibleWhere(ability, BomSubject, StandardAction.READ);

	const result = await BomService.listBomsPaged(client, filter, accessibleWhere);

	// 敏感列与字段级权限裁剪
	const items: BomListItemDto[] = result.items.map((item) => {
		// SAFETY: item 是经序列化的只读 BomListItemDto，安全转为字典对象供 CASL pickReadableFields 过滤
		const record = item as unknown as Record<string, unknown>;
		const readable = pickReadableFields(
			ability,
			BomSubject,
			record,
		);
		return {
			...item,
			...readable,
		};
	});

	return toPlainData({ ...result, items });
}

/**
 * 查询单个 BOM 详情与版本快照
 */
export async function getBomDetailQuery(
	bomId: string,
	targetVersionNumber?: number,
): Promise<BomDetailDto> {
	const { client, ability } = await getTenantProductionCenterContext();
	assertProductionCenterAbility(ability, StandardAction.READ, BomSubject);

	const detail = await BomService.getBomDetail(client, bomId, targetVersionNumber);
	return toPlainData(detail);
}

/**
 * 表单辅助下拉项 (React.cache 单请求去重)
 */
export const getBomFormOptionsQuery = cache(
	async (): Promise<BomFormOptions> => {
		const { client, ability } = await getTenantProductionCenterContext();
		assertProductionCenterAbility(ability, StandardAction.READ, BomSubject);

		const options = await BomService.getFormOptions(client);
		return toPlainData(options);
	},
);
