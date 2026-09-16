"use server";

import { revalidatePath } from "next/cache";
import {
  StandardAction,
  type StandardPageDescriptor,
} from "@base/authorization";
import { defineServerAction, toPlainData } from "@base/shared";
import {
  getTenantAdminContext,
  assertTenantAdminAbility,
} from "../../assembly/context";
import { TenantMenuItemSubject } from "./contract";
import { NavManagementService } from "./service";
import type { NavigationConfigData, SaveMenuTreeInput } from "./types";

/**
 * 保存租户自定义导航菜单树 Server Action
 */
export const saveMenuTreeAction = defineServerAction(
  async (
    input: SaveMenuTreeInput,
    availablePages: readonly StandardPageDescriptor[] = [],
  ): Promise<NavigationConfigData> => {
    const { client, userId, ability } = await getTenantAdminContext();
    assertTenantAdminAbility(
      ability,
      StandardAction.UPDATE,
      TenantMenuItemSubject,
    );

    const service = new NavManagementService(client);
    const result = await service.saveMenuTree(input, userId, availablePages);

    revalidatePath("/", "layout");
    return toPlainData(result);
  },
  "保存导航菜单配置失败",
);

/**
 * 一键重置为出厂默认菜单 Server Action
 */
export const resetMenuTreeAction = defineServerAction(
  async (
    availablePages: readonly StandardPageDescriptor[] = [],
  ): Promise<NavigationConfigData> => {
    const { client, ability } = await getTenantAdminContext();
    assertTenantAdminAbility(
      ability,
      StandardAction.UPDATE,
      TenantMenuItemSubject,
    );

    const service = new NavManagementService(client);
    const result = await service.resetToDefault(availablePages);

    revalidatePath("/", "layout");
    return toPlainData(result);
  },
  "重置出厂默认菜单失败",
);
