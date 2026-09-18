"use server";

import { createResourceActions } from "@base/biz-shared";
import {
  assertCustomerAbility,
  getTenantCustomerContext,
} from "../../assembly/context";
import { CustomerAction, CustomerField, CustomerSubject } from "./contract";
import {
  parseCreateCustomerInput,
  parseUpdateCustomerInput,
} from "./schema";
import { CustomerService } from "./service";
import type {
  CreateCustomerInput,
  CustomerStatus,
  UpdateCustomerInput,
} from "./types";

/**
 * 资源 Action：样板由 @base/biz-shared createResourceActions 承担。
 * Next 约定：`use server` 文件必须 **平铺导出** 异步函数。
 */
const actions = createResourceActions<CreateCustomerInput, UpdateCustomerInput, unknown>({
  getContext: async () => {
    const ctx = await getTenantCustomerContext();
    return {
      client: ctx.client,
      ability: ctx.ability,
      userId: ctx.userId,
      deptId: ctx.employeeProfile?.departmentId ?? null,
    };
  },
  subject: CustomerSubject,
  controlledFields: Object.values(CustomerField),
  assertAbility: (ability, action, subject) => {
    assertCustomerAbility(
      ability as Parameters<typeof assertCustomerAbility>[0],
      action as Parameters<typeof assertCustomerAbility>[1],
      subject as Parameters<typeof assertCustomerAbility>[2],
    );
  },
  revalidatePaths: ["/customer/customers"],
  schemas: {
    create: parseCreateCustomerInput,
    update: parseUpdateCustomerInput,
  },
  service: {
    create: (client, input, ctx) =>
      CustomerService.createCustomer(
        client as never,
        input as CreateCustomerInput,
        ctx,
      ),
    update: (client, id, input, ctx) =>
      CustomerService.updateCustomer(
        client as never,
        id,
        input as UpdateCustomerInput,
        ctx,
      ),
    remove: (client, id, ctx) =>
      CustomerService.deleteCustomer(client as never, id, ctx),
    toggleStatus: (client, id, status, ctx) =>
      CustomerService.updateCustomerStatus(
        client as never,
        id,
        status as CustomerStatus,
        ctx,
      ),
  },
  toggleAction: CustomerAction.TOGGLE_STATUS,
  toggleExtraRevalidatePaths: ["/customer/stores"],
  errorMessages: {
    create: "创建客户失败",
    update: "更新客户失败",
    delete: "删除客户失败",
    toggle: "更新客户状态失败",
  },
});

export const createCustomerAction = actions.create!;
export const updateCustomerAction = actions.update!;
export const deleteCustomerAction = actions.remove!;
export const updateCustomerStatusAction = actions.toggleStatus!;
