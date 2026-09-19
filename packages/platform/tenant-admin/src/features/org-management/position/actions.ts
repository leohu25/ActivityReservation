"use server";
import { StandardAction } from "@base/authorization";

import { revalidatePath } from "next/cache";
import { defineServerAction } from "@base/shared";
import {
  getTenantAdminContext,
  assertTenantAdminAbility,
} from "../../../assembly/context";
import { PositionSubject, PositionAction } from "./contract";
import { PositionService } from "./service";
import {
  createPositionSchema,
  updatePositionSchema,
  type CreatePositionSchema,
  type UpdatePositionSchema,
} from "./schema";
import type { PositionItem } from "./types";

const posService = new PositionService();

/** 创建岗位 Server Action */
export const createPositionAction = defineServerAction(
  async (input: CreatePositionSchema): Promise<PositionItem> => {
    const validated = createPositionSchema.parse(input);
    const { client, ability } = await getTenantAdminContext();
    assertTenantAdminAbility(ability, StandardAction.CREATE, PositionSubject);

    const data = await posService.createPosition(client, validated);

    revalidatePath("/organization/positions");
    revalidatePath("/organization/employees");
    return data;
  },
  "创建岗位失败",
);

/** 更新岗位 Server Action */
export const updatePositionAction = defineServerAction(
  async (id: string, input: UpdatePositionSchema): Promise<PositionItem> => {
    const validated = updatePositionSchema.parse(input);
    const { client, ability } = await getTenantAdminContext();
    assertTenantAdminAbility(ability, StandardAction.UPDATE, PositionSubject);

    const data = await posService.updatePosition(client, id, validated);

    revalidatePath("/organization/positions");
    revalidatePath("/organization/employees");
    return data;
  },
  "更新岗位失败",
);

/** 切换岗位启用/停用状态 Server Action */
export const togglePositionStatusAction = defineServerAction(
  async (id: string): Promise<PositionItem> => {
    const { client, ability } = await getTenantAdminContext();
    assertTenantAdminAbility(
      ability,
      PositionAction.TOGGLE_STATUS,
      PositionSubject,
    );

    const data = await posService.togglePositionStatus(client, id);

    revalidatePath("/organization/positions");
    revalidatePath("/organization/employees");
    return data;
  },
  "切换岗位状态失败",
);

/** 删除岗位 Server Action */
export const deletePositionAction = defineServerAction(
  async (id: string): Promise<void> => {
    const { client, ability } = await getTenantAdminContext();
    assertTenantAdminAbility(ability, StandardAction.DELETE, PositionSubject);

    await posService.deletePosition(client, id);

    revalidatePath("/organization/positions");
    revalidatePath("/organization/employees");
  },
  "删除岗位失败",
);
