import assert from "node:assert/strict";
import test from "node:test";
import { createMongoAbility } from "@casl/ability";
import { createPrismaAbility } from "@casl/prisma";
import type { TenantPrismaClient } from "@chenrun/db-tenant";
import type { ProcurementAnyAbility } from "../types";
import { ProcurementOrderService } from "./procurement-order-service";

function createMockPrisma(initialOrders: Array<Record<string, unknown>> = []) {
  const orders = [...initialOrders];

  return {
    purchaseOrder: {
      findMany: async (args?: { where?: Record<string, unknown> }) => {
        if (!args?.where) return orders;
        return orders.filter((o) => {
          // 处理 accessibleBy 生成的 { OR: [ { deptId: 'dept_sales' } ] } 结构
          if (Array.isArray(args.where?.OR)) {
            return (args.where.OR as Array<Record<string, unknown>>).some(
              (cond) => {
                if ("deptId" in cond) {
                  const val = cond.deptId;
                  if (typeof val === "object" && val && "in" in val) {
                    return (val as { in: string[] }).in.includes(
                      o.deptId as string,
                    );
                  }
                  return o.deptId === val;
                }
                return true;
              },
            );
          }
          for (const [key, value] of Object.entries(args.where ?? {})) {
            if (key === "deptId") {
              if (typeof value === "object" && value && "in" in value) {
                const inList = (value as { in: string[] }).in;
                if (!inList.includes(o.deptId as string)) return false;
              } else if (typeof value === "string" && o.deptId !== value) {
                return false;
              }
            } else if (key === "createdById" && o.createdById !== value) {
              return false;
            }
          }
          return true;
        });
      },
      findUnique: async (args: { where: { id: string } }) => {
        return orders.find((o) => o.id === args.where.id) ?? null;
      },
      create: async (args: { data: Record<string, unknown> }) => {
        const newOrder = {
          id: `po_test_${Date.now()}_${Math.random()}`,
          ...args.data,
          createdAt: new Date(),
          updatedAt: new Date(),
          department: { id: args.data.deptId, name: "测试部门" },
        };
        orders.push(newOrder);
        return newOrder;
      },
      update: async (args: {
        where: { id: string };
        data: Record<string, unknown>;
      }) => {
        const idx = orders.findIndex((o) => o.id === args.where.id);
        if (idx === -1) throw new Error("Order not found");
        orders[idx] = {
          ...orders[idx],
          ...args.data,
          updatedAt: new Date(),
        };
        return orders[idx];
      },
    },
  } as unknown as TenantPrismaClient;
}

test("ProcurementOrderService.listOrders 能够依据 CASL 数据范围过滤并对成本价脱敏", async () => {
  const service = new ProcurementOrderService();
  const mockPrisma = createMockPrisma([
    {
      id: "po_1",
      orderNo: "PO-2026-001",
      supplierName: "供应商A",
      quantity: 10,
      costPrice: 5000,
      deptId: "dept_sales",
      createdById: "user_buyer_1",
      status: "PENDING",
      auditComment: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      department: { id: "dept_sales", name: "销售部" },
    },
    {
      id: "po_2",
      orderNo: "PO-2026-002",
      supplierName: "供应商B",
      quantity: 5,
      costPrice: 2000,
      deptId: "dept_finance",
      createdById: "user_buyer_2",
      status: "APPROVED",
      auditComment: "合规通过",
      createdAt: new Date(),
      updatedAt: new Date(),
      department: { id: "dept_finance", name: "财务部" },
    },
  ]);

  // 1. 无成本价查看权限但有读取权限
  const rules1 = [
    {
      action: "read",
      subject: "PurchaseOrder",
      fields: ["orderNo", "supplierName", "quantity", "status"],
      conditions: { deptId: "dept_sales" },
    },
  ];
  const maskedAbility = createPrismaAbility(
    rules1 as unknown as Parameters<typeof createPrismaAbility>[0],
  );

  const orders1 = await service.listOrders(
    mockPrisma,
    maskedAbility,
    "user_buyer_1",
  );
  assert.equal(orders1.length, 1);
  assert.equal(orders1[0].orderNo, "PO-2026-001");
  assert.equal(orders1[0].isCostPriceMasked, true);
  assert.match(orders1[0].costPrice, /脱敏/);
  // 自己建的单子不能审核，且标记 isSelfAuditBlocked
  assert.equal(orders1[0].canAuditThisOrder, false);

  // 2. 有成本价查看权限与审核权限
  const managerAbility = createPrismaAbility([
    {
      action: "read",
      subject: "PurchaseOrder",
      fields: ["orderNo", "supplierName", "quantity", "costPrice", "status"],
    },
    {
      action: "audit",
      subject: "PurchaseOrder",
    },
  ]);

  const orders2 = await service.listOrders(
    mockPrisma,
    managerAbility,
    "user_manager",
  );
  assert.equal(orders2.length, 2);
  assert.equal(orders2[0].isCostPriceMasked, false);
  assert.match(orders2[0].costPrice, /¥/);
  // 管理员非创建者，可审核 PENDING 状态的订单
  const pendingOrder = orders2.find((o) => o.id === "po_1");
  assert.equal(pendingOrder?.canAuditThisOrder, true);
  assert.equal(pendingOrder?.isSelfAuditBlocked, false);
});

test("ProcurementOrderService.createOrder 校验合法字段、生成单号并校验部门", async () => {
  const service = new ProcurementOrderService();
  const mockPrisma = createMockPrisma([]);

  const buyerAbility = createMongoAbility([
    {
      action: "create",
      subject: "PurchaseOrder",
    },
    {
      action: "update",
      subject: "PurchaseOrder",
      fields: ["supplierName", "quantity", "costPrice"],
    },
    {
      action: "read",
      subject: "PurchaseOrder",
      fields: ["supplierName", "quantity", "costPrice"],
    },
  ]);

  // 1. 正常创建成功
  const order = await service.createOrder(
    mockPrisma,
    buyerAbility,
    { userId: "user_buyer_1", departmentId: "dept_procurement" },
    { supplierName: "苏州晨润智能精密", quantity: 20, costPrice: 1500 },
  );

  assert.match(order.orderNo, /^PO-\d{8}-[A-Z0-9]+$/);
  assert.equal(order.supplierName, "苏州晨润智能精密");
  assert.equal(order.quantity, 20);
  assert.equal(order.status, "PENDING");
  assert.equal(order.deptId, "dept_procurement");

  // 2. 缺失部门阻断
  await assert.rejects(
    service.createOrder(
      mockPrisma,
      buyerAbility,
      { userId: "user_buyer_1", departmentId: "" },
      { supplierName: "无名供应商", quantity: 5, costPrice: 100 },
    ),
    /未分配所属部门/,
  );

  // 3. 非法数量阻断
  await assert.rejects(
    service.createOrder(
      mockPrisma,
      buyerAbility,
      { userId: "user_buyer_1", departmentId: "dept_procurement" },
      { supplierName: "无名供应商", quantity: 0, costPrice: 100 },
    ),
    /采购数量必须为大于 0 的有效正整数/,
  );

  // 4. 无权限创建阻断
  const readOnlyAbility = createMongoAbility([
    { action: "read", subject: "PurchaseOrder" },
  ]);
  await assert.rejects(
    service.createOrder(
      mockPrisma,
      readOnlyAbility,
      { userId: "user_buyer_1", departmentId: "dept_procurement" },
      { supplierName: "测试", quantity: 1, costPrice: 10 },
    ),
    /权限拒绝/,
  );
});

test("ProcurementOrderService.auditOrder 严格遵守【禁止自审】铁律", async () => {
  const service = new ProcurementOrderService();
  const mockPrisma = createMockPrisma([
    {
      id: "po_self",
      orderNo: "PO-2026-SELF",
      supplierName: "供应商",
      quantity: 1,
      costPrice: 100,
      deptId: "dept_procurement",
      createdById: "user_auditor_who_created",
      status: "PENDING",
      auditComment: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      department: { id: "dept_procurement", name: "采购部" },
    },
  ]);

  const auditAbility = createMongoAbility([
    { action: "audit", subject: "PurchaseOrder" },
  ]);

  // 创建人尝试自审自己提交的订单，必须触发业务安全红线报错
  await assert.rejects(
    service.auditOrder(
      mockPrisma,
      auditAbility,
      { userId: "user_auditor_who_created" },
      { orderId: "po_self", action: "APPROVE", auditComment: "自审通过" },
    ),
    /严禁采购人员审核自己创建的订单 \(禁止自审\)/,
  );
});

test("ProcurementOrderService.auditOrder 严格单向状态机流转 (仅 PENDING 允许审核)", async () => {
  const service = new ProcurementOrderService();
  const mockPrisma = createMockPrisma([
    {
      id: "po_audit_pending",
      orderNo: "PO-2026-AUDIT",
      supplierName: "优质供应商",
      quantity: 50,
      costPrice: 99000,
      deptId: "dept_procurement",
      createdById: "user_buyer_99",
      status: "PENDING",
      auditComment: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      department: { id: "dept_procurement", name: "采购部" },
    },
  ]);

  const auditAbility = createMongoAbility([
    { action: "audit", subject: "PurchaseOrder" },
    { action: "read", subject: "PurchaseOrder" },
  ]);

  // 1. 首次审批成功流转为 APPROVED
  const approved = await service.auditOrder(
    mockPrisma,
    auditAbility,
    { userId: "user_manager_leader" },
    {
      orderId: "po_audit_pending",
      action: "APPROVE",
      auditComment: "价格合理准予采购",
    },
  );
  assert.equal(approved.status, "APPROVED");
  assert.equal(approved.auditComment, "价格合理准予采购");

  // 2. 尝试再次审核已审批单据，必须报错阻断
  await assert.rejects(
    service.auditOrder(
      mockPrisma,
      auditAbility,
      { userId: "user_manager_leader" },
      {
        orderId: "po_audit_pending",
        action: "REJECT",
        auditComment: "反悔驳回",
      },
    ),
    /禁止重复处理/,
  );
});

test("ProcurementOrderService.exportOrders 导出安全字段并遵循脱敏规则", async () => {
  const service = new ProcurementOrderService();
  const mockPrisma = createMockPrisma([
    {
      id: "po_export_1",
      orderNo: "PO-EXPORT-001",
      supplierName: "供应商Export",
      quantity: 100,
      costPrice: 88888,
      deptId: "dept_sales",
      createdById: "user_1",
      status: "APPROVED",
      auditComment: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      department: { id: "dept_sales", name: "销售部" },
    },
  ]);

  // 1. 具有导出权限但无成本价权限 (不可读且不可导出 costPrice)
  const exportNoPriceAbility = createMongoAbility([
    {
      action: "export",
      subject: "PurchaseOrder",
      fields: ["orderNo", "supplierName", "quantity", "status"],
    },
    {
      action: "read",
      subject: "PurchaseOrder",
      fields: ["orderNo", "supplierName", "quantity", "status"],
    },
  ]);

  const exported1 = await service.exportOrders(
    mockPrisma,
    exportNoPriceAbility as unknown as ProcurementAnyAbility,
  );
  assert.equal(exported1.length, 1);
  assert.equal(exported1[0].orderNo, "PO-EXPORT-001");
  assert.equal(exported1[0].costPrice, undefined);

  // 2. 具有导出权限且具备成本价权限
  const exportWithPriceAbility = createPrismaAbility([
    { action: "export", subject: "PurchaseOrder" },
    { action: "read", subject: "PurchaseOrder", fields: ["costPrice"] },
  ]);

  const exported2 = await service.exportOrders(
    mockPrisma,
    exportWithPriceAbility,
  );
  assert.equal(exported2.length, 1);
  assert.equal(exported2[0].costPrice, "88888");
});
