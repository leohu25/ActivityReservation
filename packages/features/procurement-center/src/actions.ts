"use server";

import { revalidatePath } from "next/cache";
import {
  getProcurementOrderService,
  getTenantProcurementContext,
} from "./server/session";
import type {
  CreateOrderInput,
  AuditOrderInput,
  ProcurementOrderItem,
} from "./types";

/**
 * 创建采购订单 Server Action
 */
export async function createOrderAction(
  input: CreateOrderInput,
): Promise<{ success: boolean; data?: ProcurementOrderItem; error?: string }> {
  try {
    const ctx = await getTenantProcurementContext();
    const service = getProcurementOrderService();

    if (!ctx.topology.departmentId) {
      return {
        success: false,
        error: "业务阻断：您在当前租户内尚未分配所属部门档案，无法提交采购订单",
      };
    }

    const created = await service.createOrder(
      ctx.prisma,
      ctx.ability,
      {
        userId: ctx.userId,
        memberId: ctx.memberId,
        departmentId: ctx.topology.departmentId,
      },
      input,
    );

    revalidatePath("/procurement/orders");
    return { success: true, data: created };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "创建采购单失败";
    return { success: false, error: message };
  }
}

/**
 * 审核采购订单 Server Action (严格拦截自审)
 */
export async function auditOrderAction(
  input: AuditOrderInput,
): Promise<{ success: boolean; data?: ProcurementOrderItem; error?: string }> {
  try {
    const ctx = await getTenantProcurementContext();
    const service = getProcurementOrderService();

    const audited = await service.auditOrder(
      ctx.prisma,
      ctx.ability,
      {
        userId: ctx.userId,
        memberId: ctx.memberId,
      },
      input,
    );

    revalidatePath("/procurement/orders");
    return { success: true, data: audited };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "审核采购单失败";
    return { success: false, error: message };
  }
}
