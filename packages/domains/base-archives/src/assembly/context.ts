import {
	createTenantSliceContext,
	type TenantSliceContext,
} from "@base/authorization/server";
import { baseArchivesCatalog } from "../catalog";
import type {
	BaseArchivesActionType,
	BaseArchivesSubjectType,
} from "../shared/contract-types";

export type TenantBaseArchivesContext = TenantSliceContext<
	BaseArchivesActionType,
	BaseArchivesSubjectType
>;

/**
 * 业务区域装配层：组合租户 DB 上下文与 Base Archives 权限目录。
 * 依托基座高阶工厂 createTenantSliceContext，内置 React.cache() 记忆化。
 */
export const {
	getContext: getTenantBaseArchivesContext,
	assertAbility: assertBaseArchivesAbility,
} = createTenantSliceContext<
	BaseArchivesActionType,
	BaseArchivesSubjectType
>(baseArchivesCatalog);
