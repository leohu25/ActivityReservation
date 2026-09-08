import { headers } from "next/headers";
import { getServerAuthRuntime } from "@chenrun/auth";
import type { OrganizationMemberRecord } from "@chenrun/db-control";
import { TenantRoleService } from "../services/tenant-role-service";

export interface TenantAdminSessionContext {
  readonly organizationId: string;
  readonly userId: string;
  readonly member: OrganizationMemberRecord;
}

/** 校验并提取当前租户管理员会话上下文 (Fail-Closed) */
export async function requireTenantAdminSession(): Promise<TenantAdminSessionContext> {
  const runtime = getServerAuthRuntime();
  const session = await runtime.auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    throw new Error("请先登录系统");
  }

  const activeOrgId = session.session?.activeOrganizationId;
  if (!activeOrgId) {
    throw new Error("未激活任何租户组织上下文");
  }

  const member = await runtime.tenantContextRepository.findMember(
    activeOrgId,
    session.user.id,
  );

  if (!member) {
    throw new Error("您不是当前租户成员，无权访问管理后台");
  }

  // 严格权限守卫：仅允许 owner 或 admin 角色管理权限配置
  const roleList = member.role
    .split(",")
    .map((r) => r.trim())
    .filter(Boolean);
  const isTenantAdmin = roleList.includes("owner") || roleList.includes("admin");

  if (!isTenantAdmin) {
    throw new Error("权限不足：仅企业管理员 (owner / admin) 允许管理角色与权限");
  }

  return {
    organizationId: activeOrgId,
    userId: session.user.id,
    member,
  };
}

/** 获取租户角色管理服务实例 */
export function getTenantRoleService(): TenantRoleService {
  const runtime = getServerAuthRuntime();
  return new TenantRoleService(runtime.tenantContextRepository);
}
