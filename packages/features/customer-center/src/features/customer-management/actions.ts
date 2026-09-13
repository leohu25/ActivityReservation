"use server";
import { StandardAction } from "@base/authorization";

import { revalidatePath } from "next/cache";
import { defineServerAction } from "@base/shared";
import {
  assertCustomerAbility,
  getTenantCustomerContext,
} from "../../assembly/context";
import { CustomerAction, CustomerSubject } from "./contract";
import { CustomerService } from "./service";
import type { CreateCustomerInput, UpdateCustomerInput } from "./types";

export const createCustomerAction = defineServerAction(
  async (input: CreateCustomerInput) => {
    const { client, ability, userId, employeeProfile } =
      await getTenantCustomerContext();
    assertCustomerAbility(ability, StandardAction.CREATE, CustomerSubject);
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
    assertCustomerAbility(ability, StandardAction.UPDATE, CustomerSubject);
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
    assertCustomerAbility(ability, CustomerAction.TOGGLE_STATUS, CustomerSubject);
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
    assertCustomerAbility(ability, StandardAction.DELETE, CustomerSubject);
    const deleted = await CustomerService.deleteCustomer(client, customerCode, {
      userId,
    });
    revalidatePath("/customer/customers");
    return deleted;
  },
  "删除客户失败",
);
