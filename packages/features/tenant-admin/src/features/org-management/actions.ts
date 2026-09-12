"use server";

import { revalidatePath } from "next/cache";
import { defineServerAction } from "@base/shared";
import { pickReadableFields } from "@base/authorization";
import {
  getTenantAdminContext,
  assertTenantAdminAbility,
} from "../../assembly/context";
import { getControlDbClient } from "../../shared/server/tenant-context";
import { DepartmentSubject } from "./department.contract";
import { PositionSubject } from "./position.contract";
import { EmployeeSubject } from "./employee.contract";
import { DepartmentService } from "./department-service";
import { PositionService } from "./position-service";
import { EmployeeManagementService } from "./employee-management-service";
import type {
  CreateDepartmentInput,
  UpdateDepartmentInput,
  DepartmentTreeNode,
  CreatePositionInput,
  UpdatePositionInput,
  PositionItem,
  DirectCreateEmployeeInput,
  EmployeeItem,
  EmployeeListFilter,
  TransferDepartmentInput,
  TransferPositionInput,
  TransferRolesInput,
} from "./types";

const deptService = new DepartmentService();
const posService = new PositionService();
const empService = new EmployeeManagementService();

// ==========================================
// 部门管理 Actions
// ==========================================

export const listDepartmentTreeAction = defineServerAction(
  async (): Promise<readonly DepartmentTreeNode[]> => {
    const { client, ability } = await getTenantAdminContext();
    assertTenantAdminAbility(ability, "read", DepartmentSubject);

    return deptService.listDepartmentTree(client);
  },
  "检索部门树失败",
);

export const createDepartmentAction = defineServerAction(
  async (input: CreateDepartmentInput): Promise<DepartmentTreeNode> => {
    const { client, ability } = await getTenantAdminContext();
    assertTenantAdminAbility(ability, "create", DepartmentSubject);

    const data = await deptService.createDepartment(client, input);
    revalidatePath("/organization/departments");
    revalidatePath("/organization/employees");
    return data;
  },
  "创建部门失败",
);

export const updateDepartmentAction = defineServerAction(
  async (
    id: string,
    input: UpdateDepartmentInput,
  ): Promise<DepartmentTreeNode> => {
    const { client, ability } = await getTenantAdminContext();
    assertTenantAdminAbility(ability, "update", DepartmentSubject);

    const data = await deptService.updateDepartment(client, id, input);
    revalidatePath("/organization/departments");
    revalidatePath("/organization/employees");
    return data;
  },
  "更新部门失败",
);

export const deleteDepartmentAction = defineServerAction(
  async (id: string): Promise<void> => {
    const { client, ability } = await getTenantAdminContext();
    assertTenantAdminAbility(ability, "delete", DepartmentSubject);

    await deptService.deleteDepartment(client, id);
    revalidatePath("/organization/departments");
    revalidatePath("/organization/employees");
  },
  "撤销部门失败",
);

// ==========================================
// 岗位管理 Actions
// ==========================================

export const listPositionsAction = defineServerAction(
  async (): Promise<readonly PositionItem[]> => {
    const { client, ability } = await getTenantAdminContext();
    assertTenantAdminAbility(ability, "read", PositionSubject);

    return posService.listPositions(client);
  },
  "检索岗位列表失败",
);

export const createPositionAction = defineServerAction(
  async (input: CreatePositionInput): Promise<PositionItem> => {
    const { client, ability } = await getTenantAdminContext();
    assertTenantAdminAbility(ability, "create", PositionSubject);

    const data = await posService.createPosition(client, input);
    revalidatePath("/organization/positions");
    revalidatePath("/organization/employees");
    return data;
  },
  "创建岗位失败",
);

export const updatePositionAction = defineServerAction(
  async (id: string, input: UpdatePositionInput): Promise<PositionItem> => {
    const { client, ability } = await getTenantAdminContext();
    assertTenantAdminAbility(ability, "update", PositionSubject);

    const data = await posService.updatePosition(client, id, input);
    revalidatePath("/organization/positions");
    revalidatePath("/organization/employees");
    return data;
  },
  "更新岗位失败",
);

export const togglePositionStatusAction = defineServerAction(
  async (id: string): Promise<PositionItem> => {
    const { client, ability } = await getTenantAdminContext();
    assertTenantAdminAbility(ability, "update", PositionSubject);

    const data = await posService.togglePositionStatus(client, id);
    revalidatePath("/organization/positions");
    return data;
  },
  "切换岗位状态失败",
);

export const deletePositionAction = defineServerAction(
  async (id: string): Promise<void> => {
    const { client, ability } = await getTenantAdminContext();
    assertTenantAdminAbility(ability, "delete", PositionSubject);

    await posService.deletePosition(client, id);
    revalidatePath("/organization/positions");
    revalidatePath("/organization/employees");
  },
  "删除岗位失败",
);

// ==========================================
// 员工管理 Actions
// ==========================================

export const listEmployeesAction = defineServerAction(
  async (filter?: EmployeeListFilter): Promise<readonly EmployeeItem[]> => {
    const { client, organizationId, ability } = await getTenantAdminContext();
    assertTenantAdminAbility(ability, "read", EmployeeSubject);

    const controlPrisma = await getControlDbClient();
    const data = await empService.listEmployees(
      client,
      controlPrisma,
      organizationId,
      filter,
    );

    return data.map((item) => {
      // SAFETY: pickReadableFields safely filters out HIDDEN keys from EmployeeItem record
      const safeItem = pickReadableFields(
        ability,
        EmployeeSubject,
        item as unknown as Record<string, unknown>,
      );
      // SAFETY: safeItem is the original EmployeeItem with only sensitive fields stripped or masked
      return safeItem as unknown as EmployeeItem;
    });
  },
  "检索员工列表失败",
);

export const directCreateEmployeeAction = defineServerAction(
  async (input: DirectCreateEmployeeInput): Promise<EmployeeItem> => {
    const { client, organizationId, ability } = await getTenantAdminContext();
    assertTenantAdminAbility(ability, "create", EmployeeSubject);

    const controlPrisma = await getControlDbClient();
    const data = await empService.directCreateEmployee(
      client,
      controlPrisma,
      organizationId,
      input,
    );

    revalidatePath("/organization/employees");
    revalidatePath("/organization/departments");
    revalidatePath("/organization/positions");
    return data;
  },
  "创建员工失败",
);

export const transferDepartmentAction = defineServerAction(
  async (input: TransferDepartmentInput): Promise<void> => {
    const { client, organizationId, ability } = await getTenantAdminContext();
    assertTenantAdminAbility(ability, "update", EmployeeSubject);

    const controlPrisma = await getControlDbClient();
    await empService.transferDepartment(
      client,
      controlPrisma,
      organizationId,
      input,
    );

    revalidatePath("/organization/employees");
    revalidatePath("/organization/departments");
  },
  "调换部门失败",
);

export const transferPositionAction = defineServerAction(
  async (input: TransferPositionInput): Promise<void> => {
    const { client, ability } = await getTenantAdminContext();
    assertTenantAdminAbility(ability, "update", EmployeeSubject);

    await empService.transferPosition(client, input);

    revalidatePath("/organization/employees");
    revalidatePath("/organization/positions");
  },
  "调换岗位失败",
);

export const transferRolesAction = defineServerAction(
  async (input: TransferRolesInput): Promise<void> => {
    const { organizationId, ability } = await getTenantAdminContext();
    assertTenantAdminAbility(ability, "update", EmployeeSubject);

    const controlPrisma = await getControlDbClient();
    await empService.transferRoles(controlPrisma, organizationId, input);

    revalidatePath("/organization/employees");
    revalidatePath("/settings/roles");
  },
  "分配角色失败",
);

export const suspendEmployeeAction = defineServerAction(
  async (employeeId: string): Promise<void> => {
    const { client, organizationId, ability } = await getTenantAdminContext();
    assertTenantAdminAbility(ability, "delete", EmployeeSubject);

    const controlPrisma = await getControlDbClient();
    await empService.suspendEmployee(
      client,
      controlPrisma,
      organizationId,
      employeeId,
    );

    revalidatePath("/organization/employees");
  },
  "停用员工失败",
);

export const resumeEmployeeAction = defineServerAction(
  async (employeeId: string): Promise<void> => {
    const { client, organizationId, ability } = await getTenantAdminContext();
    assertTenantAdminAbility(ability, "update", EmployeeSubject);

    const controlPrisma = await getControlDbClient();
    await empService.resumeEmployee(
      client,
      controlPrisma,
      organizationId,
      employeeId,
    );

    revalidatePath("/organization/employees");
  },
  "恢复员工失败",
);
