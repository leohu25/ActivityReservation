import "server-only";

import { toPlainData } from "@base/shared";
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
 const result = await service.listTenantsPaged(user, params);
 return toPlainData(result);
}

/**
 * RSC Server-only 读取全部租户列表及其物理数据库
 */
export async function listTenantsQuery(): Promise<ControlTenantItem[]> {
 const user = await requireControlAdminSession();
 const service = getTenantManagementService();
 const result = await service.listTenants(user);
 return toPlainData(result);
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
 const result = await service.getTenantDetail(orgId, user, query);
 return toPlainData(result);
}
