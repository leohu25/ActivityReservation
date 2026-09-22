import "server-only";

import { cache } from "react";
import { StandardAction } from "@base/authorization";
import { toPlainData } from "@base/shared";
import {
	assertProductionCenterAbility,
	getTenantProductionCenterContext,
} from "../../assembly/context";
import { BomSubject } from "./contract";
import { BomService } from "./service";
import type { BomDetailDto, BomFormOptions, ListBomFilter, ListBomsResult } from "./types";

/**
 * 分页查询 BOM 列表 (RSC 读取，支持 Nuqs URL 过滤)
 */
export async function listBomsQuery(
	filter: ListBomFilter = {},
): Promise<ListBomsResult> {
	const { client, ability } = await getTenantProductionCenterContext();
	assertProductionCenterAbility(ability, StandardAction.READ, BomSubject);

	const result = await BomService.listBomsPaged(client, filter);
	return toPlainData(result);
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
