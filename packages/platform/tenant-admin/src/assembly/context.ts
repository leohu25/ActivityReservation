import {
	createTenantSliceContext,
	type TenantSliceContext,
} from "@base/authorization/server";
import { tenantAdminCatalog } from "../catalog";
import type {
	TenantAdminActionType,
	TenantAdminSubjectType,
} from "../shared/contract-types";

export type TenantAdminContext = TenantSliceContext<
	TenantAdminActionType,
	TenantAdminSubjectType
>;

/**
 * 业务区域 (Business Area) 装配层：
 * 组合底座租户 DB 上下文与 tenant-admin 全域 PermissionCatalog，
 * 编译出具备完整 CASL 权限树与 Prisma 数据范围下推的运行时能力实例。
 * 依托基座高阶工厂 createTenantSliceContext，内置 React.cache() 记忆化。
 */
export const {
	getContext: getTenantAdminContext,
	assertAbility: assertTenantAdminAbility,
} = createTenantSliceContext<
	TenantAdminActionType,
	TenantAdminSubjectType
>(tenantAdminCatalog);
