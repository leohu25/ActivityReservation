"use server";
import { StandardAction } from "@base/authorization";

import { revalidatePath } from "next/cache";
import { defineServerAction } from "@base/shared";
import {
  getTenantAdminContext,
  assertTenantAdminAbility,
} from "../../../assembly/context";
import { getControlDbClient } from "../../../shared/server/tenant-context";
import { EmployeeSubject } from "./contract";
import { EmployeeManagementService } from "./service";
import {
  directCreateEmployeeSchema,
  updateEmployeeSchema,
  transferDepartmentSchema,
  transferPositionSchema,
  transferRolesSchema,
  type DirectCreateEmployeeSchema,
  type UpdateEmployeeSchema,
  type TransferDepartmentSchema,
  type TransferPositionSchema,
  type TransferRolesSchema,
} from "./schema";
import type { EmployeeItem, EmployeeListFilter } from "./types";

const empService = new EmployeeManagementService();

export const listEmployeesAction = defineServerAction(
  async (filter?: EmployeeListFilter): Promise<readonly EmployeeItem[]> => {
    const { client, organizationId, ability } = await getTenantAdminContext();
    assertTenantAdminAbility(ability, StandardAction.READ, EmployeeSubject);

    const controlPrisma = await getControlDbClient();
    return empService.listEmployees(client, controlPrisma, organizationId, filter);
  },
  "获取员工列表失败",
);

export const directCreateEmployeeAction = defineServerAction(
  async (input: DirectCreateEmployeeSchema): Promise<EmployeeItem> => {
    const validated = directCreateEmployeeSchema.parse(input);
    const { client, organizationId, ability } = await getTenantAdminContext();
    assertTenantAdminAbility(ability, StandardAction.CREATE, EmployeeSubject);

    const controlPrisma = await getControlDbClient();
    const data = await empService.directCreateEmployee(
      client,
      controlPrisma,
      organizationId,
      validated,
    );

    revalidatePath("/organization/employees");
    revalidatePath("/organization/departments");
    revalidatePath("/organization/positions");
    return data;
  },
  "创建员工失败",
);

export const updateEmployeeAction = defineServerAction(
  async (id: string, input: UpdateEmployeeSchema): Promise<EmployeeItem> => {
    const validated = updateEmployeeSchema.parse(input);
    const { client, organizationId, ability } = await getTenantAdminContext();
    assertTenantAdminAbility(ability, StandardAction.UPDATE, EmployeeSubject);

    const controlPrisma = await getControlDbClient();
    const data = await empService.updateEmployee(
      client,
      controlPrisma,
      organizationId,
      id,
      validated,
    );

    revalidatePath("/organization/employees");
    revalidatePath("/organization/departments");
    revalidatePath("/organization/positions");
    return data;
  },
  "更新员工失败",
);

export const transferDepartmentAction = defineServerAction(
  async (input: TransferDepartmentSchema): Promise<void> => {
    const validated = transferDepartmentSchema.parse(input);
    const { client, organizationId, ability } = await getTenantAdminContext();
    assertTenantAdminAbility(ability, StandardAction.UPDATE, EmployeeSubject);

    const controlPrisma = await getControlDbClient();
    await empService.transferDepartment(
      client,
      controlPrisma,
      organizationId,
      validated,
    );

    revalidatePath("/organization/employees");
    revalidatePath("/organization/departments");
  },
  "调换部门失败",
);

export const transferPositionAction = defineServerAction(
  async (input: TransferPositionSchema): Promise<void> => {
    const validated = transferPositionSchema.parse(input);
    const { client, ability } = await getTenantAdminContext();
    assertTenantAdminAbility(ability, StandardAction.UPDATE, EmployeeSubject);

    await empService.transferPosition(client, validated);

    revalidatePath("/organization/employees");
    revalidatePath("/organization/positions");
  },
  "调换岗位失败",
);

export const transferRolesAction = defineServerAction(
  async (input: TransferRolesSchema): Promise<void> => {
    const validated = transferRolesSchema.parse(input);
    const { organizationId, ability } = await getTenantAdminContext();
    assertTenantAdminAbility(ability, StandardAction.UPDATE, EmployeeSubject);

    const controlPrisma = await getControlDbClient();
    await empService.transferRoles(controlPrisma, organizationId, validated);

    revalidatePath("/organization/employees");
    revalidatePath("/settings/roles");
  },
  "分配角色失败",
);

export const suspendEmployeeAction = defineServerAction(
  async (employeeId: string): Promise<void> => {
    const { client, organizationId, ability } = await getTenantAdminContext();
    assertTenantAdminAbility(ability, StandardAction.DELETE, EmployeeSubject);

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
    assertTenantAdminAbility(ability, StandardAction.UPDATE, EmployeeSubject);

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

export const deleteEmployeeAction = defineServerAction(
  async (employeeId: string): Promise<void> => {
    const { client, organizationId, ability } = await getTenantAdminContext();
    assertTenantAdminAbility(ability, StandardAction.DELETE, EmployeeSubject);

    const controlPrisma = await getControlDbClient();
    await empService.suspendEmployee(
      client,
      controlPrisma,
      organizationId,
      employeeId,
    );

    revalidatePath("/organization/employees");
  },
  "删除员工失败",
);
