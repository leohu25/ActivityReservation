import "server-only";

import { requireControlAdminSession } from "../../shared/server/session";
import { getTenantManagementService } from "./service";
import type {
 ControlTenantItem,
 ControlTenantDetail,
 GetTenantMembersQuery,
 ListTenantsQueryInput,
 PagedTenantsResult,
} from "./types";

/**
 * RSC Server-only 读取租户分页列表（Database-driven Paged Query）
 */
export async function listTenantsPagedQuery(
 params?: ListTenantsQueryInput,
): Promise<PagedTenantsResult> {
 const user = await requireControlAdminSession();
 const service = getTenantManagementService();
 return service.listTenantsPaged(user, params);
}

/**
 * RSC Server-only 读取全部租户列表及其物理数据库
 */
export async function listTenantsQuery(): Promise<ControlTenantItem[]> {
 const user = await requireControlAdminSession();
 const service = getTenantManagementService();
 return service.listTenants(user);
}

/**
 * RSC Server-only 读取单个租户详情与成员
 */
export async function getTenantDetailQuery(
 orgId: string,
 query?: GetTenantMembersQuery,
): Promise<ControlTenantDetail | null> {
 const user = await requireControlAdminSession();
 const service = getTenantManagementService();
 return service.getTenantDetail(orgId, user, query);
}
