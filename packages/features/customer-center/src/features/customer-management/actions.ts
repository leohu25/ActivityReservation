"use server";
import { StandardAction, assertEditableFields } from "@base/authorization";
import type { AnyMongoAbility } from "@casl/ability";

import { revalidatePath } from "next/cache";
import { defineServerAction } from "@base/shared";
import {
  assertCustomerAbility,
  getTenantCustomerContext,
} from "../../assembly/context";
import { CustomerAction, CustomerField, CustomerSubject } from "./contract";
import { CustomerService } from "./service";
import type {
  CreateCustomerInput,
  CustomerStatus,
  UpdateCustomerInput,
} from "./types";

const CONTROLLED_FIELDS = new Set<string>(Object.values(CustomerField));

/** 提取仅在受控字典内且值不为 undefined 的显式变更字段 */
function extractControlledPayload(
  input: Record<string, unknown>,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input)) {
    if (v !== undefined && CONTROLLED_FIELDS.has(k)) {
      payload[k] = v;
    }
  }
  return payload;
}

export const createCustomerAction = defineServerAction(
  async (input: CreateCustomerInput) => {
    const { client, ability, userId, employeeProfile } =
      await getTenantCustomerContext();
    assertCustomerAbility(ability, StandardAction.CREATE, CustomerSubject);
    // SAFETY: ability 具备 AnyMongoAbility can/rules 运行时契约，供 assertEditableFields 断言字段权限
    assertEditableFields(
      ability as unknown as AnyMongoAbility,
      CustomerSubject,
      extractControlledPayload(input as unknown as Record<string, unknown>),
    );
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
    // SAFETY: ability 具备 AnyMongoAbility can/rules 运行时契约，供 assertEditableFields 断言字段权限
    assertEditableFields(
      ability as unknown as AnyMongoAbility,
      CustomerSubject,
      extractControlledPayload(input as unknown as Record<string, unknown>),
    );
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
  async (customerCode: string, status: CustomerStatus) => {
    const { client, ability, userId } = await getTenantCustomerContext();
    assertCustomerAbility(
      ability,
      CustomerAction.TOGGLE_STATUS,
      CustomerSubject,
    );
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
