"use server";

import { revalidatePath } from "next/cache";
import { defineServerAction } from "@chenrun/shared";
import {
  assertCustomerAbility,
  getTenantCustomerContext,
} from "../../assembly/context";
import { CustomerStoreSubject } from "./contract";
import { CustomerStoreService } from "./service";
import type { CreateStoreInput, UpdateStoreInput } from "./types";

export const createStoreAction = defineServerAction(
  async (input: CreateStoreInput) => {
    const { client, ability, userId, employeeProfile } =
      await getTenantCustomerContext();
    assertCustomerAbility(ability, "create", CustomerStoreSubject);
    const created = await CustomerStoreService.createStore(client, input, {
      userId,
      deptId: employeeProfile?.departmentId ?? null,
    });
    revalidatePath("/customer/stores");
    revalidatePath("/customer/customers");
    return created;
  },
  "创建门店失败",
);

export const updateStoreAction = defineServerAction(
  async (storeCode: string, input: UpdateStoreInput) => {
    const { client, ability, userId } = await getTenantCustomerContext();
    assertCustomerAbility(ability, "update", CustomerStoreSubject);
    const updated = await CustomerStoreService.updateStore(
      client,
      storeCode,
      input,
      { userId },
    );
    revalidatePath("/customer/stores");
    return updated;
  },
  "更新门店失败",
);

export const updateStoreStatusAction = defineServerAction(
  async (storeCode: string, status: "ACTIVE" | "DISABLED") => {
    const { client, ability, userId } = await getTenantCustomerContext();
    assertCustomerAbility(ability, "update", CustomerStoreSubject);
    const updated = await CustomerStoreService.updateStoreStatus(
      client,
      storeCode,
      status,
      { userId },
    );
    revalidatePath("/customer/stores");
    return updated;
  },
  "更新门店状态失败",
);

export const deleteStoreAction = defineServerAction(
  async (storeCode: string) => {
    const { client, ability, userId } = await getTenantCustomerContext();
    assertCustomerAbility(ability, "delete", CustomerStoreSubject);
    const deleted = await CustomerStoreService.deleteStore(client, storeCode, {
      userId,
    });
    revalidatePath("/customer/stores");
    return deleted;
  },
  "删除门店失败",
);
