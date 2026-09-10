"use server";

import { revalidatePath } from "next/cache";
import type { RolePermissionPayload } from "@chenrun/authorization";
import type {
  CompanyProfileData,
  CreateDepartmentInput,
  CreatePositionInput,
  DepartmentTreeNode,
  DirectCreateEmployeeInput,
  EmployeeItem,
  EmployeeListFilter,
  GeneralSettingsData,
  PositionItem,
  SecuritySettingsData,
  TenantRoleItem,
  TransferDepartmentInput,
  TransferPositionInput,
  TransferRolesInput,
  UpdateCompanyProfileInput,
  UpdateDepartmentInput,
  UpdateGeneralSettingsInput,
  UpdatePositionInput,
  UpdateSecuritySettingsInput,
} from "./types";
import {
  getControlPrismaClient,
  getDepartmentService,
  getEmployeeManagementService,
  getPositionService,
  getTenantPrismaClient,
  getTenantRoleService,
  getTenantSettingsService,
  requireTenantAdminSession,
} from "./server/session";
import { deriveBuiltInRoleDefaults } from "./services/tenant-role-service";

/** 保存或更新角色四层权限 Server Action */
export async function saveRolePermissionsAction(
  role: string,
  payload: RolePermissionPayload,
): Promise<{ success: boolean; data?: TenantRoleItem; error?: string }> {
  try {
    const session = await requireTenantAdminSession();
    const service = getTenantRoleService();

    const data = await service.saveRolePermissions({
      organizationId: session.organizationId,
      role,
      payload,
    });

    revalidatePath("/settings/roles");
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "保存角色权限失败";
    return { success: false, error: message };
  }
}

/** 新增自定义角色 Server Action */
export async function createRoleAction(
  roleCode: string,
  roleName?: string,
  description?: string,
): Promise<{ success: boolean; data?: TenantRoleItem; error?: string }> {
  try {
    const session = await requireTenantAdminSession();
    const service = getTenantRoleService();

    const data = await service.createRole({
      organizationId: session.organizationId,
      roleCode,
      roleName,
      description,
    });

    revalidatePath("/settings/roles");
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "创建角色失败";
    return { success: false, error: message };
  }
}

/** 删除自定义角色 Server Action */
export async function deleteRoleAction(
  role: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await requireTenantAdminSession();
    const service = getTenantRoleService();

    await service.deleteRole(session.organizationId, role);

    revalidatePath("/settings/roles");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "删除角色失败";
    return { success: false, error: message };
  }
}

/** 获取系统内置角色推荐权限模板 Server Action */
export async function getSystemRoleDefaultsAction(
  role: string,
): Promise<{ success: boolean; data?: RolePermissionPayload; error?: string }> {
  try {
    await requireTenantAdminSession();
    const defaults = deriveBuiltInRoleDefaults();
    if (role === "admin") {
      return { success: true, data: defaults.admin };
    }
    if (role === "member") {
      return { success: true, data: defaults.member };
    }
    return {
      success: true,
      data: { statement: {}, dataScopes: [], fieldPolicies: [] },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "获取推荐权限模板失败";
    return { success: false, error: message };
  }
}

/** 获取企业信息 Server Action */
export async function getCompanyProfileAction(): Promise<{
  success: boolean;
  data?: CompanyProfileData;
  error?: string;
}> {
  try {
    const session = await requireTenantAdminSession();
    const service = getTenantSettingsService();
    const data = await service.getCompanyProfile(session.organizationId);
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "获取企业信息失败";
    return { success: false, error: message };
  }
}

/** 更新企业信息 Server Action */
export async function updateCompanyProfileAction(
  input: UpdateCompanyProfileInput,
): Promise<{
  success: boolean;
  data?: CompanyProfileData;
  error?: string;
}> {
  try {
    const session = await requireTenantAdminSession();
    const service = getTenantSettingsService();
    const data = await service.updateCompanyProfile(
      session.organizationId,
      input,
    );
    revalidatePath("/settings/company");
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "更新企业信息失败";
    return { success: false, error: message };
  }
}

/** 获取系统基础设置 Server Action */
export async function getGeneralSettingsAction(): Promise<{
  success: boolean;
  data?: GeneralSettingsData;
  error?: string;
}> {
  try {
    const session = await requireTenantAdminSession();
    const service = getTenantSettingsService();
    const data = await service.getGeneralSettings(session.organizationId);
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "获取基础设置失败";
    return { success: false, error: message };
  }
}

/** 更新系统基础设置 Server Action */
export async function updateGeneralSettingsAction(
  input: UpdateGeneralSettingsInput,
): Promise<{
  success: boolean;
  data?: GeneralSettingsData;
  error?: string;
}> {
  try {
    const session = await requireTenantAdminSession();
    const service = getTenantSettingsService();
    const data = await service.updateGeneralSettings(
      session.organizationId,
      input,
    );
    revalidatePath("/settings/general");
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "更新基础设置失败";
    return { success: false, error: message };
  }
}

/** 获取安全策略设置 Server Action */
export async function getSecuritySettingsAction(): Promise<{
  success: boolean;
  data?: SecuritySettingsData;
  error?: string;
}> {
  try {
    const session = await requireTenantAdminSession();
    const service = getTenantSettingsService();
    const data = await service.getSecuritySettings(session.organizationId);
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "获取安全设置失败";
    return { success: false, error: message };
  }
}

/** 更新安全策略设置 Server Action */
export async function updateSecuritySettingsAction(
  input: UpdateSecuritySettingsInput,
): Promise<{
  success: boolean;
  data?: SecuritySettingsData;
  error?: string;
}> {
  try {
    const session = await requireTenantAdminSession();
    const service = getTenantSettingsService();
    const data = await service.updateSecuritySettings(
      session.organizationId,
      input,
    );
    revalidatePath("/settings/security");
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "更新安全设置失败";
    return { success: false, error: message };
  }
}

// ==========================================
// 组织架构：部门管理 Server Actions
// ==========================================

/** 检索部门树 Server Action */
export async function listDepartmentTreeAction(): Promise<{
  success: boolean;
  data?: readonly DepartmentTreeNode[];
  error?: string;
}> {
  try {
    const session = await requireTenantAdminSession();
    const tenantPrisma = await getTenantPrismaClient(session.organizationId);
    const service = getDepartmentService();

    const data = await service.listDepartmentTree(tenantPrisma);
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "检索部门树失败";
    return { success: false, error: message };
  }
}

/** 创建部门 Server Action */
export async function createDepartmentAction(
  input: CreateDepartmentInput,
): Promise<{
  success: boolean;
  data?: DepartmentTreeNode;
  error?: string;
}> {
  try {
    const session = await requireTenantAdminSession();
    const tenantPrisma = await getTenantPrismaClient(session.organizationId);
    const service = getDepartmentService();

    const data = await service.createDepartment(tenantPrisma, input);
    revalidatePath("/organization/departments");
    revalidatePath("/organization/employees");
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "创建部门失败";
    return { success: false, error: message };
  }
}

/** 更新部门 Server Action */
export async function updateDepartmentAction(
  id: string,
  input: UpdateDepartmentInput,
): Promise<{
  success: boolean;
  data?: DepartmentTreeNode;
  error?: string;
}> {
  try {
    const session = await requireTenantAdminSession();
    const tenantPrisma = await getTenantPrismaClient(session.organizationId);
    const service = getDepartmentService();

    const data = await service.updateDepartment(tenantPrisma, id, input);
    revalidatePath("/organization/departments");
    revalidatePath("/organization/employees");
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "更新部门失败";
    return { success: false, error: message };
  }
}

/** 删除部门 Server Action (Fail-Closed) */
export async function deleteDepartmentAction(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const session = await requireTenantAdminSession();
    const tenantPrisma = await getTenantPrismaClient(session.organizationId);
    const service = getDepartmentService();

    await service.deleteDepartment(tenantPrisma, id);
    revalidatePath("/organization/departments");
    revalidatePath("/organization/employees");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "删除部门失败";
    return { success: false, error: message };
  }
}

// ==========================================
// 组织架构：岗位管理 Server Actions
// ==========================================

/** 检索岗位字典列表 Server Action */
export async function listPositionsAction(): Promise<{
  success: boolean;
  data?: readonly PositionItem[];
  error?: string;
}> {
  try {
    const session = await requireTenantAdminSession();
    const tenantPrisma = await getTenantPrismaClient(session.organizationId);
    const service = getPositionService();

    const data = await service.listPositions(tenantPrisma);
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "检索岗位列表失败";
    return { success: false, error: message };
  }
}

/** 创建岗位 Server Action */
export async function createPositionAction(
  input: CreatePositionInput,
): Promise<{
  success: boolean;
  data?: PositionItem;
  error?: string;
}> {
  try {
    const session = await requireTenantAdminSession();
    const tenantPrisma = await getTenantPrismaClient(session.organizationId);
    const service = getPositionService();

    const data = await service.createPosition(tenantPrisma, input);
    revalidatePath("/organization/positions");
    revalidatePath("/organization/employees");
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "创建岗位失败";
    return { success: false, error: message };
  }
}

/** 更新岗位 Server Action */
export async function updatePositionAction(
  id: string,
  input: UpdatePositionInput,
): Promise<{
  success: boolean;
  data?: PositionItem;
  error?: string;
}> {
  try {
    const session = await requireTenantAdminSession();
    const tenantPrisma = await getTenantPrismaClient(session.organizationId);
    const service = getPositionService();

    const data = await service.updatePosition(tenantPrisma, id, input);
    revalidatePath("/organization/positions");
    revalidatePath("/organization/employees");
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "更新岗位失败";
    return { success: false, error: message };
  }
}

/** 切换岗位启用停用状态 Server Action */
export async function togglePositionStatusAction(id: string): Promise<{
  success: boolean;
  data?: PositionItem;
  error?: string;
}> {
  try {
    const session = await requireTenantAdminSession();
    const tenantPrisma = await getTenantPrismaClient(session.organizationId);
    const service = getPositionService();

    const data = await service.togglePositionStatus(tenantPrisma, id);
    revalidatePath("/organization/positions");
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "切换岗位状态失败";
    return { success: false, error: message };
  }
}

/** 删除岗位 Server Action */
export async function deletePositionAction(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const session = await requireTenantAdminSession();
    const tenantPrisma = await getTenantPrismaClient(session.organizationId);
    const service = getPositionService();

    await service.deletePosition(tenantPrisma, id);
    revalidatePath("/organization/positions");
    revalidatePath("/organization/employees");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "删除岗位失败";
    return { success: false, error: message };
  }
}

// ==========================================
// 组织架构：员工档案与生命周期 Server Actions
// ==========================================

/** 检索员工列表 Server Action */
export async function listEmployeesAction(
  filter?: EmployeeListFilter,
): Promise<{
  success: boolean;
  data?: readonly EmployeeItem[];
  error?: string;
}> {
  try {
    const session = await requireTenantAdminSession();
    const tenantPrisma = await getTenantPrismaClient(session.organizationId);
    const controlPrisma = getControlPrismaClient();
    const service = getEmployeeManagementService();

    const data = await service.listEmployees(
      tenantPrisma,
      controlPrisma,
      session.organizationId,
      filter,
    );
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "检索员工列表失败";
    return { success: false, error: message };
  }
}

/** 直接录入建号新员工 Server Action */
export async function directCreateEmployeeAction(
  input: DirectCreateEmployeeInput,
): Promise<{
  success: boolean;
  data?: EmployeeItem;
  error?: string;
}> {
  try {
    const session = await requireTenantAdminSession();
    const tenantPrisma = await getTenantPrismaClient(session.organizationId);
    const controlPrisma = getControlPrismaClient();
    const service = getEmployeeManagementService();

    const data = await service.directCreateEmployee(
      tenantPrisma,
      controlPrisma,
      session.organizationId,
      input,
    );
    revalidatePath("/organization/employees");
    revalidatePath("/organization/departments");
    revalidatePath("/organization/positions");
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "直接录入建号失败";
    return { success: false, error: message };
  }
}

/** 调换部门 Server Action */
export async function transferDepartmentAction(
  input: TransferDepartmentInput,
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const session = await requireTenantAdminSession();
    const tenantPrisma = await getTenantPrismaClient(session.organizationId);
    const controlPrisma = getControlPrismaClient();
    const service = getEmployeeManagementService();

    await service.transferDepartment(
      tenantPrisma,
      controlPrisma,
      session.organizationId,
      input,
    );
    revalidatePath("/organization/employees");
    revalidatePath("/organization/departments");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "调换部门失败";
    return { success: false, error: message };
  }
}

/** 调换岗位 Server Action */
export async function transferPositionAction(
  input: TransferPositionInput,
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const session = await requireTenantAdminSession();
    const tenantPrisma = await getTenantPrismaClient(session.organizationId);
    const service = getEmployeeManagementService();

    await service.transferPosition(tenantPrisma, input);
    revalidatePath("/organization/employees");
    revalidatePath("/organization/positions");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "调换岗位失败";
    return { success: false, error: message };
  }
}

/** 调换员工系统角色 Server Action */
export async function transferRolesAction(input: TransferRolesInput): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const session = await requireTenantAdminSession();
    const controlPrisma = getControlPrismaClient();
    const service = getEmployeeManagementService();

    await service.transferRoles(controlPrisma, session.organizationId, input);
    revalidatePath("/organization/employees");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "调整角色权限失败";
    return { success: false, error: message };
  }
}

/** 停用员工业务访问 Server Action */
export async function suspendEmployeeAction(employeeId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const session = await requireTenantAdminSession();
    const tenantPrisma = await getTenantPrismaClient(session.organizationId);
    const controlPrisma = getControlPrismaClient();
    const service = getEmployeeManagementService();

    await service.suspendEmployee(
      tenantPrisma,
      controlPrisma,
      session.organizationId,
      employeeId,
    );
    revalidatePath("/organization/employees");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "停用员工失败";
    return { success: false, error: message };
  }
}

/** 恢复员工业务访问 Server Action */
export async function resumeEmployeeAction(employeeId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const session = await requireTenantAdminSession();
    const tenantPrisma = await getTenantPrismaClient(session.organizationId);
    const controlPrisma = getControlPrismaClient();
    const service = getEmployeeManagementService();

    await service.resumeEmployee(
      tenantPrisma,
      controlPrisma,
      session.organizationId,
      employeeId,
    );
    revalidatePath("/organization/employees");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "恢复员工失败";
    return { success: false, error: message };
  }
}
