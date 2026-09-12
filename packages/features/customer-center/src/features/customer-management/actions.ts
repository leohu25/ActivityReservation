"use server";

import { revalidatePath } from "next/cache";
import { defineServerAction } from "@chenrun/shared";
import {
  assertCustomerAbility,
  getTenantCustomerContext,
} from "../../assembly/context";
import { CustomerSubject } from "./contract";
import { CustomerService } from "./service";
import type { CreateCustomerInput, UpdateCustomerInput } from "./types";

export const createCustomerAction = defineServerAction(
  async (input: CreateCustomerInput) => {
    const { client, ability, userId, employeeProfile } =
      await getTenantCustomerContext();
    assertCustomerAbility(ability, "create", CustomerSubject);
    const created = await CustomerService.createCustomer(client, input, {
      userId,
      deptId: employeeProfile?.departmentId ?? null,
    });
    revalidatePath("/customer/customers");
    return created;
  },
  "创建客户失败",
);

export const updateCustomerAction = defineServerAction(
  async (customerCode: string, input: UpdateCustomerInput) => {
    const { client, ability, userId } = await getTenantCustomerContext();
    assertCustomerAbility(ability, "update", CustomerSubject);
    const updated = await CustomerService.updateCustomer(
      client,
      customerCode,
      input,
      { userId },
    );
    revalidatePath("/customer/customers");
    return updated;
  },
  "更新客户失败",
);

export const updateCustomerStatusAction = defineServerAction(
  async (customerCode: string, status: "ACTIVE" | "DISABLED") => {
    const { client, ability, userId } = await getTenantCustomerContext();
    assertCustomerAbility(ability, "toggle_status", CustomerSubject);
    const updated = await CustomerService.updateCustomerStatus(
      client,
      customerCode,
      status,
      { userId },
    );
    revalidatePath("/customer/customers");
    revalidatePath("/customer/stores");
    return updated;
  },
  "更新客户状态失败",
);

export const deleteCustomerAction = defineServerAction(
  async (customerCode: string) => {
    const { client, ability, userId } = await getTenantCustomerContext();
    assertCustomerAbility(ability, "delete", CustomerSubject);
    const deleted = await CustomerService.deleteCustomer(client, customerCode, {
      userId,
    });
    revalidatePath("/customer/customers");
    return deleted;
  },
  "删除客户失败",
);
