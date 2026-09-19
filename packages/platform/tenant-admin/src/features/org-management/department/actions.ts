"use server";
import { StandardAction } from "@base/authorization";

import { revalidatePath } from "next/cache";
import { defineServerAction } from "@base/shared";
import {
  getTenantAdminContext,
  assertTenantAdminAbility,
} from "../../../assembly/context";
import { DepartmentSubject } from "./contract";
import { DepartmentService } from "./service";
import {
  createDepartmentSchema,
  updateDepartmentSchema,
  type CreateDepartmentSchema,
  type UpdateDepartmentSchema,
} from "./schema";
import type { DepartmentTreeNode } from "./types";

const deptService = new DepartmentService();

/** 创建部门 Server Action */
export const createDepartmentAction = defineServerAction(
  async (input: CreateDepartmentSchema): Promise<DepartmentTreeNode> => {
    const validated = createDepartmentSchema.parse(input);
    const { client, ability } = await getTenantAdminContext();
    assertTenantAdminAbility(ability, StandardAction.CREATE, DepartmentSubject);

    const data = await deptService.createDepartment(client, validated);

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
    input: UpdateDepartmentSchema,
  ): Promise<DepartmentTreeNode> => {
    const validated = updateDepartmentSchema.parse(input);
    const { client, ability } = await getTenantAdminContext();
    assertTenantAdminAbility(ability, StandardAction.UPDATE, DepartmentSubject);

    const data = await deptService.updateDepartment(client, id, validated);

    revalidatePath("/organization/departments");
    revalidatePath("/organization/employees");
    return data;
  },
  "更新部门失败",
);

/** 获取部门树 Server Action */
export const listDepartmentTreeAction = defineServerAction(
  async (): Promise<readonly DepartmentTreeNode[]> => {
    const { client, ability } = await getTenantAdminContext();
    assertTenantAdminAbility(ability, StandardAction.READ, DepartmentSubject);

    return deptService.listDepartmentTree(client);
  },
  "获取部门树失败",
);

export const deleteDepartmentAction = defineServerAction(
  async (id: string): Promise<void> => {
    const { client, ability } = await getTenantAdminContext();
    assertTenantAdminAbility(ability, StandardAction.DELETE, DepartmentSubject);

    await deptService.deleteDepartment(client, id);

    revalidatePath("/organization/departments");
    revalidatePath("/organization/employees");
  },
  "删除部门失败",
);
