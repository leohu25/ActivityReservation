"use server";

import { revalidatePath } from "next/cache";
import { defineServerAction } from "@chenrun/shared";
import { pickReadableFields } from "@chenrun/authorization";
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
  assertTenantAdminAbility,
} from "./server/session";
import { deriveBuiltInRoleDefaults } from "./services/tenant-role-service";
import {
  DepartmentSubject,
  PositionSubject,
  EmployeeSubject,
  RoleManagementSubject,
  CompanyProfileSubject,
  GeneralSettingsSubject,
  SecuritySettingsSubject,
} from "./contracts";

// ==========================================
// 角色与权限管理 Server Actions
// ==========================================

/** 保存或更新角色四层权限 Server Action */
export const saveRolePermissionsAction = defineServerAction(
  async (
    role: string,
    payload: RolePermissionPayload,
  ): Promise<TenantRoleItem> => {
    const session = await requireTenantAdminSession();
    assertTenantAdminAbility(session.ability, "update", RoleManagementSubject);
    const service = getTenantRoleService();

    const data = await service.saveRolePermissions({
      organizationId: session.organizationId,
      role,
      payload,
    });

    revalidatePath("/settings/roles");
    return data;
  },
  "保存角色权限失败",
);

/** 新增自定义角色 Server Action */
export const createRoleAction = defineServerAction(
  async (
    roleCode: string,
    roleName?: string,
    description?: string,
  ): Promise<TenantRoleItem> => {
    const session = await requireTenantAdminSession();
    assertTenantAdminAbility(session.ability, "update", RoleManagementSubject);
    const service = getTenantRoleService();

    const data = await service.createRole({
      organizationId: session.organizationId,
      roleCode,
      roleName,
      description,
    });

    revalidatePath("/settings/roles");
    return data;
  },
  "创建角色失败",
);

/** 删除自定义角色 Server Action */
export const deleteRoleAction = defineServerAction(
  async (role: string): Promise<void> => {
    const session = await requireTenantAdminSession();
    assertTenantAdminAbility(session.ability, "update", RoleManagementSubject);
    const service = getTenantRoleService();

    await service.deleteRole(session.organizationId, role);

    revalidatePath("/settings/roles");
  },
  "删除角色失败",
);

/** 获取系统内置角色推荐权限模板 Server Action */
export const getSystemRoleDefaultsAction = defineServerAction(
  async (role: string): Promise<RolePermissionPayload> => {
    const session = await requireTenantAdminSession();
    assertTenantAdminAbility(session.ability, "read", RoleManagementSubject);
    const defaults = deriveBuiltInRoleDefaults();
    if (role === "admin") {
      return defaults.admin;
    }
    if (role === "member") {
      return defaults.member;
    }
    return { statement: {}, dataScopes: [], fieldPolicies: [] };
  },
  "获取推荐权限模板失败",
);

// ==========================================
// 企业与系统配置 Server Actions
// ==========================================

/** 获取企业信息 Server Action */
export const getCompanyProfileAction = defineServerAction(
  async (): Promise<CompanyProfileData> => {
    const session = await requireTenantAdminSession();
    assertTenantAdminAbility(session.ability, "read", CompanyProfileSubject);
    const service = getTenantSettingsService();
    return service.getCompanyProfile(session.organizationId);
  },
  "获取企业信息失败",
);

/** 更新企业信息 Server Action */
export const updateCompanyProfileAction = defineServerAction(
  async (input: UpdateCompanyProfileInput): Promise<CompanyProfileData> => {
    const session = await requireTenantAdminSession();
    assertTenantAdminAbility(session.ability, "update", CompanyProfileSubject);
    const service = getTenantSettingsService();
    const data = await service.updateCompanyProfile(
      session.organizationId,
      input,
    );
    revalidatePath("/settings/company");
    return data;
  },
  "更新企业信息失败",
);

/** 获取系统基础设置 Server Action */
export const getGeneralSettingsAction = defineServerAction(
  async (): Promise<GeneralSettingsData> => {
    const session = await requireTenantAdminSession();
    assertTenantAdminAbility(session.ability, "read", GeneralSettingsSubject);
    const service = getTenantSettingsService();
    return service.getGeneralSettings(session.organizationId);
  },
  "获取基础设置失败",
);

/** 更新系统基础设置 Server Action */
export const updateGeneralSettingsAction = defineServerAction(
  async (input: UpdateGeneralSettingsInput): Promise<GeneralSettingsData> => {
    const session = await requireTenantAdminSession();
    assertTenantAdminAbility(session.ability, "update", GeneralSettingsSubject);
    const service = getTenantSettingsService();
    const data = await service.updateGeneralSettings(
      session.organizationId,
      input,
    );
    revalidatePath("/settings/general");
    return data;
  },
  "更新基础设置失败",
);

/** 获取安全策略设置 Server Action */
export const getSecuritySettingsAction = defineServerAction(
  async (): Promise<SecuritySettingsData> => {
    const session = await requireTenantAdminSession();
    assertTenantAdminAbility(session.ability, "read", SecuritySettingsSubject);
    const service = getTenantSettingsService();
    return service.getSecuritySettings(session.organizationId);
  },
  "获取安全设置失败",
);

/** 更新安全策略设置 Server Action */
export const updateSecuritySettingsAction = defineServerAction(
  async (input: UpdateSecuritySettingsInput): Promise<SecuritySettingsData> => {
    const session = await requireTenantAdminSession();
    assertTenantAdminAbility(
      session.ability,
      "update",
      SecuritySettingsSubject,
    );
    const service = getTenantSettingsService();
    const data = await service.updateSecuritySettings(
      session.organizationId,
      input,
    );
    revalidatePath("/settings/security");
    return data;
  },
  "更新安全设置失败",
);

// ==========================================
// 组织架构：部门管理 Server Actions
// ==========================================

/** 检索部门树 Server Action */
export const listDepartmentTreeAction = defineServerAction(
  async (): Promise<readonly DepartmentTreeNode[]> => {
    const session = await requireTenantAdminSession();
    assertTenantAdminAbility(session.ability, "read", DepartmentSubject);
    const tenantPrisma = await getTenantPrismaClient(session.organizationId);
    const service = getDepartmentService();

    return service.listDepartmentTree(tenantPrisma);
  },
  "检索部门树失败",
);

/** 创建部门 Server Action */
export const createDepartmentAction = defineServerAction(
  async (input: CreateDepartmentInput): Promise<DepartmentTreeNode> => {
    const session = await requireTenantAdminSession();
    assertTenantAdminAbility(session.ability, "create", DepartmentSubject);
    const tenantPrisma = await getTenantPrismaClient(session.organizationId);
    const service = getDepartmentService();

    const data = await service.createDepartment(tenantPrisma, input);
    revalidatePath("/organization/departments");
    revalidatePath("/organization/employees");
    return data;
  },
  "创建部门失败",
);

/** 更新部门 Server Action */
export const updateDepartmentAction = defineServerAction(
  async (
    id: string,
    input: UpdateDepartmentInput,
  ): Promise<DepartmentTreeNode> => {
    const session = await requireTenantAdminSession();
    assertTenantAdminAbility(session.ability, "update", DepartmentSubject);
    const tenantPrisma = await getTenantPrismaClient(session.organizationId);
    const service = getDepartmentService();

    const data = await service.updateDepartment(tenantPrisma, id, input);
    revalidatePath("/organization/departments");
    revalidatePath("/organization/employees");
    return data;
  },
  "更新部门失败",
);

/** 删除部门 Server Action (Fail-Closed) */
export const deleteDepartmentAction = defineServerAction(
  async (id: string): Promise<void> => {
    const session = await requireTenantAdminSession();
    assertTenantAdminAbility(session.ability, "delete", DepartmentSubject);
    const tenantPrisma = await getTenantPrismaClient(session.organizationId);
    const service = getDepartmentService();

    await service.deleteDepartment(tenantPrisma, id);
    revalidatePath("/organization/departments");
    revalidatePath("/organization/employees");
  },
  "删除部门失败",
);

// ==========================================
// 组织架构：岗位管理 Server Actions
// ==========================================

/** 检索岗位字典列表 Server Action */
export const listPositionsAction = defineServerAction(
  async (): Promise<readonly PositionItem[]> => {
    const session = await requireTenantAdminSession();
    assertTenantAdminAbility(session.ability, "read", PositionSubject);
    const tenantPrisma = await getTenantPrismaClient(session.organizationId);
    const service = getPositionService();

    return service.listPositions(tenantPrisma);
  },
  "检索岗位列表失败",
);

/** 创建岗位 Server Action */
export const createPositionAction = defineServerAction(
  async (input: CreatePositionInput): Promise<PositionItem> => {
    const session = await requireTenantAdminSession();
    assertTenantAdminAbility(session.ability, "create", PositionSubject);
    const tenantPrisma = await getTenantPrismaClient(session.organizationId);
    const service = getPositionService();

    const data = await service.createPosition(tenantPrisma, input);
    revalidatePath("/organization/positions");
    revalidatePath("/organization/employees");
    return data;
  },
  "创建岗位失败",
);

/** 更新岗位 Server Action */
export const updatePositionAction = defineServerAction(
  async (id: string, input: UpdatePositionInput): Promise<PositionItem> => {
    const session = await requireTenantAdminSession();
    assertTenantAdminAbility(session.ability, "update", PositionSubject);
    const tenantPrisma = await getTenantPrismaClient(session.organizationId);
    const service = getPositionService();

    const data = await service.updatePosition(tenantPrisma, id, input);
    revalidatePath("/organization/positions");
    revalidatePath("/organization/employees");
    return data;
  },
  "更新岗位失败",
);

/** 切换岗位启用停用状态 Server Action */
export const togglePositionStatusAction = defineServerAction(
  async (id: string): Promise<PositionItem> => {
    const session = await requireTenantAdminSession();
    assertTenantAdminAbility(session.ability, "update", PositionSubject);
    const tenantPrisma = await getTenantPrismaClient(session.organizationId);
    const service = getPositionService();

    const data = await service.togglePositionStatus(tenantPrisma, id);
    revalidatePath("/organization/positions");
    return data;
  },
  "切换岗位状态失败",
);

/** 删除岗位 Server Action */
export const deletePositionAction = defineServerAction(
  async (id: string): Promise<void> => {
    const session = await requireTenantAdminSession();
    assertTenantAdminAbility(session.ability, "delete", PositionSubject);
    const tenantPrisma = await getTenantPrismaClient(session.organizationId);
    const service = getPositionService();

    await service.deletePosition(tenantPrisma, id);
    revalidatePath("/organization/positions");
    revalidatePath("/organization/employees");
  },
  "删除岗位失败",
);

// ==========================================
// 组织架构：员工档案与生命周期 Server Actions
// ==========================================

/** 检索员工列表 Server Action (带敏感字段物理剥离) */
export const listEmployeesAction = defineServerAction(
  async (filter?: EmployeeListFilter): Promise<readonly EmployeeItem[]> => {
    const session = await requireTenantAdminSession();
    assertTenantAdminAbility(session.ability, "read", EmployeeSubject);
    const tenantPrisma = await getTenantPrismaClient(session.organizationId);
    const controlPrisma = getControlPrismaClient();
    const service = getEmployeeManagementService();

    const data = await service.listEmployees(
      tenantPrisma,
      controlPrisma,
      session.organizationId,
      filter,
    );

    // 服务端物理剥离 HIDDEN 敏感字段（如联系电话等），杜绝仅前端藏列泄露 payload
    return data.map((item) => {
      // SAFETY: pickReadableFields safely filters out HIDDEN keys from EmployeeItem record
      const safeItem = pickReadableFields(
        session.ability,
        EmployeeSubject,
        item as unknown as Record<string, unknown>,
      );
      // SAFETY: safeItem is the original EmployeeItem with only sensitive fields stripped or masked
      return safeItem as unknown as EmployeeItem;
    });
  },
  "检索员工列表失败",
);

/** 直接录入建号新员工 Server Action */
export const directCreateEmployeeAction = defineServerAction(
  async (input: DirectCreateEmployeeInput): Promise<EmployeeItem> => {
    const session = await requireTenantAdminSession();
    assertTenantAdminAbility(session.ability, "create", EmployeeSubject);
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
    return data;
  },
  "直接录入建号失败",
);

/** 调换部门 Server Action */
export const transferDepartmentAction = defineServerAction(
  async (input: TransferDepartmentInput): Promise<void> => {
    const session = await requireTenantAdminSession();
    assertTenantAdminAbility(session.ability, "update", EmployeeSubject);
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
  },
  "调换部门失败",
);

/** 调换岗位 Server Action */
export const transferPositionAction = defineServerAction(
  async (input: TransferPositionInput): Promise<void> => {
    const session = await requireTenantAdminSession();
    assertTenantAdminAbility(session.ability, "update", EmployeeSubject);
    const tenantPrisma = await getTenantPrismaClient(session.organizationId);
    const service = getEmployeeManagementService();

    await service.transferPosition(tenantPrisma, input);
    revalidatePath("/organization/employees");
    revalidatePath("/organization/positions");
  },
  "调换岗位失败",
);

/** 调换员工系统角色 Server Action */
export const transferRolesAction = defineServerAction(
  async (input: TransferRolesInput): Promise<void> => {
    const session = await requireTenantAdminSession();
    assertTenantAdminAbility(session.ability, "update", EmployeeSubject);
    const controlPrisma = getControlPrismaClient();
    const service = getEmployeeManagementService();

    await service.transferRoles(controlPrisma, session.organizationId, input);
    revalidatePath("/organization/employees");
  },
  "调整角色权限失败",
);

/** 停用员工业务访问 Server Action */
export const suspendEmployeeAction = defineServerAction(
  async (employeeId: string): Promise<void> => {
    const session = await requireTenantAdminSession();
    assertTenantAdminAbility(session.ability, "delete", EmployeeSubject);
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
  },
  "停用员工失败",
);

/** 恢复员工业务访问 Server Action */
export const resumeEmployeeAction = defineServerAction(
  async (employeeId: string): Promise<void> => {
    const session = await requireTenantAdminSession();
    assertTenantAdminAbility(session.ability, "update", EmployeeSubject);
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
  },
  "恢复员工失败",
);
