"use server";

import { revalidatePath } from "next/cache";
import { defineServerAction } from "@base/shared";
import type {
  ProvisionTenantResult,
  ControlTenantDetail,
  GetTenantMembersQuery,
  ResetTenantUserPasswordResult,
} from "./types";
import { parseProvisionTenantInput } from "./schema";
import { getTenantManagementService } from "./service";
import { requireControlAdminSession } from "../../shared/server/session";

/**
 * 控制平面超管开通新租户 Server Action
 * 支持直接传入 plain JSON 对象或 FormData
 */
export const provisionTenantAction = defineServerAction(
  async (raw: unknown): Promise<ProvisionTenantResult> => {
    let payload: unknown = raw;
    if (raw instanceof FormData) {
      payload = {
        name: raw.get("name"),
        slug: raw.get("slug"),
        adminEmail: raw.get("adminEmail"),
        adminName: raw.get("adminName") || undefined,
        clusterCode: raw.get("clusterCode") || undefined,
        initialPassword: raw.get("initialPassword") || undefined,
      };
    }

    const input = parseProvisionTenantInput(payload);
    const user = await requireControlAdminSession();
    const service = getTenantManagementService();
    const result = await service.provisionTenant(
      {
        name: input.name,
        slug: input.slug,
        adminEmail: input.adminEmail,
        adminName: input.adminName || undefined,
        clusterCode: input.clusterCode || undefined,
        initialPassword: input.initialPassword || undefined,
      },
      user,
    );

    revalidatePath("/tenants");
    revalidatePath("/");
    return result;
  },
  "开通租户失败",
);

/**
 * 控制平面超管启停切换租户状态 Server Action
 */
export const toggleTenantStatusAction = defineServerAction(
  async (organizationId: string): Promise<string> => {
    const user = await requireControlAdminSession();
    const service = getTenantManagementService();
    const nextStatus = await service.toggleTenantStatus(organizationId, user);

    revalidatePath("/tenants");
    revalidatePath("/");
    return nextStatus;
  },
  "切换租户状态失败",
);

/**
 * 获取租户全景详情（包含物理库拓扑与成员列表，支持搜索过滤与分页）Server Action
 */
export const getTenantDetailAction = defineServerAction(
  async (
    organizationId: string,
    query?: GetTenantMembersQuery,
  ): Promise<ControlTenantDetail | null> => {
    const user = await requireControlAdminSession();
    const service = getTenantManagementService();
    return service.getTenantDetail(organizationId, user, query);
  },
  "获取租户详情失败",
);

/**
 * 控制平面超管重置租户成员密码 Server Action
 */
export const resetTenantUserPasswordAction = defineServerAction(
  async (
    organizationId: string,
    userId: string,
    customPassword?: string,
  ): Promise<ResetTenantUserPasswordResult> => {
    const user = await requireControlAdminSession();
    const service = getTenantManagementService();
    return service.resetTenantUserPassword(
      organizationId,
      userId,
      user,
      customPassword,
    );
  },
  "重置密码失败",
);
