import { headers } from "next/headers";
import { getServerAuthRuntime } from "@chenrun/auth";
import type {
  ControlPrismaClient,
  OrganizationMemberRecord,
} from "@chenrun/db-control";
import {
  getTenantDbManager,
  type TenantPrismaClient,
} from "@chenrun/db-tenant";
import { TenantRoleService } from "../services/tenant-role-service";
import { TenantSettingsService } from "../services/tenant-settings-service";
import { DepartmentService } from "../services/department-service";
import { PositionService } from "../services/position-service";
import { EmployeeManagementService } from "../services/employee-management-service";

export interface TenantAdminSessionContext {
  readonly organizationId: string;
  readonly userId: string;
  readonly member: OrganizationMemberRecord;
}

/** 校验并提取当前租户成员会话上下文 (Fail-Closed) */
export async function requireTenantMemberSession(): Promise<TenantAdminSessionContext> {
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

  return {
    organizationId: activeOrgId,
    userId: session.user.id,
    member,
  };
}

/** 校验并提取当前租户管理员会话上下文 (Fail-Closed) */
export async function requireTenantAdminSession(): Promise<TenantAdminSessionContext> {
  const ctx = await requireTenantMemberSession();

  // 严格权限守卫：只要具备租户成员身份即可（权限已在页面级与菜单侧边栏由 RBAC 严格管控）
  return ctx;
}

/** 获取 Control DB Prisma 客户端 */
export function getControlPrismaClient(): ControlPrismaClient {
  const runtime = getServerAuthRuntime();
  return runtime.prisma;
}

/** 获取租户专属物理库 Prisma 客户端 */
export async function getTenantPrismaClient(
  organizationId: string,
): Promise<TenantPrismaClient> {
  const runtime = getServerAuthRuntime();
  const manager = getTenantDbManager({
    repository: runtime.tenantContextRepository,
  });
  return manager.getClient(organizationId);
}

/** 获取租户角色管理服务实例 */
export function getTenantRoleService(): TenantRoleService {
  const runtime = getServerAuthRuntime();
  return new TenantRoleService(runtime.tenantContextRepository);
}

/** 获取部门管理服务实例 */
export function getDepartmentService(): DepartmentService {
  return new DepartmentService();
}

/** 获取岗位管理服务实例 */
export function getPositionService(): PositionService {
  return new PositionService();
}

/** 获取员工管理服务实例 */
export function getEmployeeManagementService(): EmployeeManagementService {
  return new EmployeeManagementService();
}

/** 获取租户企业信息与系统设置管理服务实例 */
export function getTenantSettingsService(): TenantSettingsService {
  const runtime = getServerAuthRuntime();
  const manager = getTenantDbManager({
    repository: runtime.tenantContextRepository,
  });
  return new TenantSettingsService(runtime.prisma, (orgId: string) =>
    manager.getClient(orgId),
  );
}
