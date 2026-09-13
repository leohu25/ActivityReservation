"use server";

import { revalidatePath } from "next/cache";
import { defineServerAction } from "@base/shared";
import {
  assertOrderAbility,
  getTenantOrderContext,
} from "../../assembly/context";
import { SalesOrderSubject, SalesOrderAction } from "./contract";
import {
  createSalesOrder,
  auditSalesOrder,
  cancelSalesOrder,
  markSalesOrderReadyToShip,
  addSalesOrderFee,
  auditSalesOrderFee,
  deleteSalesOrder,
  getSalesOrderDetail,
} from "./service";
import type { CreateSalesOrderInput, AddOrderFeeInput } from "./types";

export const createSalesOrderAction = defineServerAction(
  async (input: CreateSalesOrderInput) => {
    const { client, ability, userId, employeeProfile } =
      await getTenantOrderContext();
    assertOrderAbility(ability, "create", SalesOrderSubject);

    const created = await createSalesOrder(client, input, {
      userId,
      deptId: employeeProfile?.departmentId ?? null,
    });
    revalidatePath("/order/sales-orders");
    return created;
  },
  "创建销售订单失败",
);

export const auditSalesOrderAction = defineServerAction(
  async (orderId: string) => {
    const { client, ability, userId, employeeProfile } =
      await getTenantOrderContext();
    assertOrderAbility(ability, SalesOrderAction.AUDIT, SalesOrderSubject);

    await auditSalesOrder(client, orderId, {
      userId,
      deptId: employeeProfile?.departmentId ?? null,
    });
    revalidatePath("/order/sales-orders");
    return { success: true };
  },
  "审核销售订单失败",
);

export const cancelSalesOrderAction = defineServerAction(
  async (orderId: string, reason?: string) => {
    const { client, ability, userId, employeeProfile } =
      await getTenantOrderContext();
    assertOrderAbility(ability, SalesOrderAction.CANCEL, SalesOrderSubject);

    await cancelSalesOrder(
      client,
      orderId,
      {
        userId,
        deptId: employeeProfile?.departmentId ?? null,
      },
      reason,
    );
    revalidatePath("/order/sales-orders");
    return { success: true };
  },
  "取消销售订单失败",
);

export const markSalesOrderReadyToShipAction = defineServerAction(
  async (orderId: string) => {
    const { client, ability, userId, employeeProfile } =
      await getTenantOrderContext();
    assertOrderAbility(
      ability,
      SalesOrderAction.ONE_CLICK_SHIP,
      SalesOrderSubject,
    );

    await markSalesOrderReadyToShip(client, orderId, {
      userId,
      deptId: employeeProfile?.departmentId ?? null,
    });
    revalidatePath("/order/sales-orders");
    return { success: true };
  },
  "标记一键发货失败",
);

export const addSalesOrderFeeAction = defineServerAction(
  async (orderId: string, input: AddOrderFeeInput) => {
    const { client, ability, userId, employeeProfile } =
      await getTenantOrderContext();
    assertOrderAbility(ability, SalesOrderAction.ADD_FEE, SalesOrderSubject);

    await addSalesOrderFee(client, orderId, input, {
      userId,
      deptId: employeeProfile?.departmentId ?? null,
    });
    revalidatePath("/order/sales-orders");
    return { success: true };
  },
  "添加订单费用失败",
);

export const auditSalesOrderFeeAction = defineServerAction(
  async (feeId: string, auditStatus: "APPROVED" | "REJECTED") => {
    const { client, ability, userId, employeeProfile } =
      await getTenantOrderContext();
    assertOrderAbility(ability, SalesOrderAction.AUDIT_FEE, SalesOrderSubject);

    await auditSalesOrderFee(client, feeId, auditStatus, {
      userId,
      deptId: employeeProfile?.departmentId ?? null,
    });
    revalidatePath("/order/sales-orders");
    return { success: true };
  },
  "复核订单费用失败",
);

export const deleteSalesOrderAction = defineServerAction(
  async (orderId: string) => {
    const { client, ability, userId, employeeProfile } =
      await getTenantOrderContext();
    assertOrderAbility(ability, "delete", SalesOrderSubject);

    await deleteSalesOrder(client, orderId, {
      userId,
      deptId: employeeProfile?.departmentId ?? null,
    });
    revalidatePath("/order/sales-orders");
    return { success: true };
  },
  "删除销售订单失败",
);

export const getSalesOrderDetailAction = defineServerAction(
  async (orderId: string) => {
    const { client, ability } = await getTenantOrderContext();
    assertOrderAbility(ability, "read", SalesOrderSubject);
    return getSalesOrderDetail(client, orderId);
  },
  "获取销售订单详情失败",
);

export const getCustomerStoresAction = defineServerAction(
  async (customerCode: string) => {
    const { client, ability } = await getTenantOrderContext();
    assertOrderAbility(ability, "read", SalesOrderSubject);
    const stores = await client.customerStore.findMany({
      where: {
        customerCode,
        status: "ACTIVE",
        isDeleted: false,
      },
      select: {
        storeCode: true,
        storeName: true,
        regionCode: true,
        deliveryPeriod: true,
        defaultRoute: true,
        defaultDriver: true,
      },
      orderBy: { storeCode: "asc" },
    });
    return stores;
  },
  "获取客户门店列表失败",
);
