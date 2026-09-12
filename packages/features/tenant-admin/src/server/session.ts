import { headers } from "next/headers";
import {
  getCurrentTenantContext,
  getServerAuthRuntime,
  assertTenantAccessGate,
} from "@chenrun/auth";
import { CaslAbilityFactory, type AppAbility } from "@chenrun/authorization";
import { ForbiddenError } from "@casl/ability";
import type {
  ControlPrismaClient,
  OrganizationMemberRecord,
} from "@chenrun/db-control";
import {
  getTenantDbManager,
  type TenantPrismaClient,
} from "@chenrun/db-tenant";
import { tenantAdminCatalog } from "../catalog";
import { TenantRoleService } from "../services/tenant-role-service";
import { TenantSettingsService } from "../services/tenant-settings-service";
import { DepartmentService } from "../services/department-service";
import { PositionService } from "../services/position-service";
import { EmployeeManagementService } from "../services/employee-management-service";

export interface TenantAdminSessionContext {
  readonly organizationId: string;
  readonly userId: string;
  readonly member: OrganizationMemberRecord;
  readonly ability: AppAbility<string, string>;
}

/** 校验并提取当前租户成员会话上下文 (Fail-Closed) */
export async function requireTenantMemberSession(): Promise<TenantAdminSessionContext> {
  const reqHeaders = await headers();
  const tenantCtx = await getCurrentTenantContext(reqHeaders);

  const runtime = getServerAuthRuntime();

  // 若存在租户物理库档案，进行员工生命周期门禁校验 (准入防护)
  const manager = getTenantDbManager({
    repository: runtime.tenantContextRepository,
  });

  try {
    const tenantPrisma = await manager.getClient(tenantCtx.organizationId);
    const employeeProfile = await tenantPrisma.employeeProfile.findUnique({
      where: { memberId: tenantCtx.member.id },
      select: {
        id: true,
        memberId: true,
        departmentId: true,
        employeeNo: true,
        jobTitle: true,
        status: true,
      },
    });
    if (employeeProfile) {
      assertTenantAccessGate(employeeProfile);
    }
  } catch (err: unknown) {
    // 若特定异常由 assertTenantAccessGate 抛出，继续向外传递
    if (
      (err instanceof Error && err.message.includes("离职")) ||
      (err instanceof Error && err.message.includes("停用"))
    ) {
      throw err;
    }
    // 允许初次初始化或平台侧库暂时不存在对应租户表时的容错
  }

  // 构建当前租户用户的 CASL 强类型 Ability
  const factory = new CaslAbilityFactory(
    runtime.tenantContextRepository,
    tenantAdminCatalog,
  );
  const ability = (await factory.createForTenant(tenantCtx)) as AppAbility<
    string,
    string
  >;

  return {
    organizationId: tenantCtx.organizationId,
    userId: tenantCtx.user.id,
    member: tenantCtx.member,
    ability,
  };
}

/** 校验并提取当前租户管理员会话上下文 (Fail-Closed) */
export async function requireTenantAdminSession(): Promise<TenantAdminSessionContext> {
  return requireTenantMemberSession();
}

/**
 * 写路径与敏感操作强制 CASL 断言：
 * 任何后端 Server Action 执行前必须显式校验 (action, subject)。
 * 无权时抛出 ForbiddenError，由 Server Action 统一捕获并返回。
 */
export function assertTenantAdminAbility(
  ability: AppAbility<string, string>,
  action: string,
  subject: string,
): void {
  ForbiddenError.from(ability).throwUnlessCan(action, subject);
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
