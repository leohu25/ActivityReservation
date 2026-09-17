import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  findEffectiveQuotationPrice,
  createSalesOrder,
  auditSalesOrder,
  cancelSalesOrder,
  markSalesOrderReadyToShip,
  addSalesOrderFee,
  auditSalesOrderFee,
  deleteSalesOrder,
  listSalesOrders,
} from "./service";
import type { TenantPrismaClient } from "@base/db-tenant";

function createMockPrismaClient() {
  const store = {
    customerStore: [
      {
        storeCode: "STOR-001",
        customerCode: "CUST-001",
        storeName: "朝阳一店",
        regionCode: "REG-EAST",
        status: "ACTIVE",
        defaultRoute: "ROUTE-A",
        defaultDriver: "DRIVER-1",
        deliveryPeriod: "MORNING",
      },
    ],
    customer: [
      {
        customerCode: "CUST-001",
        customerName: "好味餐饮连锁",
        status: "ACTIVE",
        customerTags: "连锁,VIP",
        defaultTaxRate: 9.0,
      },
    ],
    customerQuote: [
      {
        quoteId: "QUOT-REG",
        status: "ACTIVE",
        isDeleted: false,
        customerCode: null,
        storeCode: null,
        regionCode: "REG-EAST",
        effectiveDate: new Date("2026-01-01"),
        expiryDate: null,
        items: [
          {
            itemCode: "ITEM-POTATO",
            itemName: "土豆丝",
            salesUnit: "kg",
            unitPriceExclTax: 4.5,
            unitPriceInclTax: 5.0,
            taxRate: 9.0,
          },
        ],
      },
      {
        quoteId: "QUOT-STORE",
        status: "ACTIVE",
        isDeleted: false,
        customerCode: "CUST-001",
        storeCode: "STOR-001",
        regionCode: "REG-EAST",
        effectiveDate: new Date("2026-01-01"),
        expiryDate: null,
        items: [
          {
            itemCode: "ITEM-POTATO",
            itemName: "土豆丝",
            salesUnit: "kg",
            unitPriceExclTax: 4.0,
            unitPriceInclTax: 4.5,
            taxRate: 9.0,
          },
        ],
      },
    ],
    salesOrder: [] as any[],
    salesOrderItem: [] as any[],
    salesOrderFee: [] as any[],
  };

  const client = {
    customerStore: {
      findUnique: async ({ where }: any) => {
        return (
          store.customerStore.find((s) => s.storeCode === where.storeCode) ||
          null
        );
      },
      findMany: async () => store.customerStore,
    },
    customer: {
      findUnique: async ({ where }: any) => {
        return (
          store.customer.find((c) => c.customerCode === where.customerCode) ||
          null
        );
      },
      findMany: async () => store.customer,
    },
    customerQuote: {
      findMany: async () => {
        return store.customerQuote;
      },
    },
    salesOrder: {
      findUnique: async ({ where }: any) => {
        const o = store.salesOrder.find((s) => s.orderId === where.orderId);
        if (!o) return null;
        return {
          ...o,
          items: store.salesOrderItem.filter((i) => i.orderId === o.orderId),
          fees: store.salesOrderFee.filter((f) => f.orderId === o.orderId),
        };
      },
      findFirst: async ({ where }: any) => {
        if (where?.orderId?.startsWith) {
          const prefix = where.orderId.startsWith;
          const matched = store.salesOrder
            .filter((s) => s.orderId.startsWith(prefix))
            .sort((a, b) => b.orderId.localeCompare(a.orderId));
          return matched[0] || null;
        }
        return null;
      },
      findMany: async () => store.salesOrder,
      create: async ({ data }: any) => {
        const record = {
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        store.salesOrder.push(record);
        return record;
      },
      update: async ({ where, data }: any) => {
        const idx = store.salesOrder.findIndex(
          (s) => s.orderId === where.orderId,
        );
        if (idx !== -1) {
          store.salesOrder[idx] = { ...store.salesOrder[idx], ...data };
          return store.salesOrder[idx];
        }
        return null;
      },
    },
    salesOrderItem: {
      create: async ({ data }: any) => {
        store.salesOrderItem.push(data);
        return data;
      },
    },
    salesOrderFee: {
      count: async () => store.salesOrderFee.length,
      create: async ({ data }: any) => {
        const record = {
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        store.salesOrderFee.push(record);
        return record;
      },
      findUnique: async ({ where }: any) => {
        return store.salesOrderFee.find((f) => f.feeId === where.feeId) || null;
      },
      update: async ({ where, data }: any) => {
        const idx = store.salesOrderFee.findIndex(
          (f) => f.feeId === where.feeId,
        );
        if (idx !== -1) {
          store.salesOrderFee[idx] = { ...store.salesOrderFee[idx], ...data };
          return store.salesOrderFee[idx];
        }
        return null;
      },
    },
    $transaction: async (fn: (tx: any) => Promise<any>) => {
      return fn(client);
    },
  };

  return { client: client as unknown as TenantPrismaClient, store };
}

describe("SalesOrderService 领域服务与业务规则测试", () => {
  it("验收标准 1: 报价优先级匹配 - 门店报价优先于区域报价", async () => {
    const { client } = createMockPrismaClient();
    const price = await findEffectiveQuotationPrice(client, {
      customerCode: "CUST-001",
      storeCode: "STOR-001",
      itemCode: "ITEM-POTATO",
    });

    assert.ok(price);
    // 应该匹配 STOR-001 的门店专属价格 4.5，而不是区域价格 5.0
    assert.strictEqual(price.unitPriceInclTax, 4.5);
    assert.strictEqual(price.unitPriceExclTax, 4.0);
  });

  it("验收标准 1 & 10: 创建销售订单自动带出报价与明细计算", async () => {
    const { client, store } = createMockPrismaClient();
    const order = await createSalesOrder(
      client,
      {
        customerCode: "CUST-001",
        storeCode: "STOR-001",
        deliveryDate: "2026-10-01",
        items: [
          {
            itemCode: "ITEM-POTATO",
            itemName: "土豆丝",
            salesUnit: "kg",
            orderQty: 20,
          },
        ],
      },
      { userId: "USER-1", deptId: "DEPT-1" },
    );

    assert.ok(order.orderId.startsWith("SO-"));
    assert.strictEqual(order.customerCode, "CUST-001");
    assert.strictEqual(order.storeCode, "STOR-001");
    assert.strictEqual(order.items.length, 1);
    assert.strictEqual(order.items[0].unitPriceInclTax, 4.5);
    assert.strictEqual(order.items[0].subtotalAmount, 90); // 20 * 4.5
    assert.strictEqual(order.totalAmount, 90);
    assert.strictEqual(order.status, "DRAFT");
    assert.strictEqual(order.fulfillmentStatus, "PENDING_SUMMARY");
    assert.strictEqual(order.settlementStatus, "UNRECONCILED");
    assert.strictEqual(store.salesOrder.length, 1);
  });

  it("验收标准 2: 审核订单后状态流转与锁定", async () => {
    const { client } = createMockPrismaClient();
    const order = await createSalesOrder(
      client,
      {
        customerCode: "CUST-001",
        storeCode: "STOR-001",
        deliveryDate: "2026-10-01",
        items: [
          {
            itemCode: "ITEM-POTATO",
            itemName: "土豆丝",
            salesUnit: "kg",
            orderQty: 10,
          },
        ],
      },
      { userId: "USER-1" },
    );

    await auditSalesOrder(client, order.orderId, { userId: "AUDITOR-1" });
    const orderAfterAudit = await client.salesOrder.findUnique({
      where: { orderId: order.orderId },
    });
    assert.strictEqual(orderAfterAudit?.status, "APPROVED");
    assert.strictEqual(orderAfterAudit?.lockStatus, "LOCKED");

    // 已审核不可删除
    await assert.rejects(
      async () => {
        await deleteSalesOrder(client, order.orderId, { userId: "USER-1" });
      },
      { message: /已审核订单不允许删除/ },
    );
  });

  it("验收标准 7: 已安排生产 (PRODUCING) 不能取消", async () => {
    const { client, store } = createMockPrismaClient();
    const order = await createSalesOrder(
      client,
      {
        customerCode: "CUST-001",
        storeCode: "STOR-001",
        deliveryDate: "2026-10-01",
        items: [
          {
            itemCode: "ITEM-POTATO",
            itemName: "土豆丝",
            salesUnit: "kg",
            orderQty: 10,
          },
        ],
      },
      { userId: "USER-1" },
    );

    // 模拟进入生产中
    store.salesOrder[0].fulfillmentStatus = "PRODUCING";

    await assert.rejects(
      async () => {
        await cancelSalesOrder(
          client,
          order.orderId,
          { userId: "USER-1" },
          "不需要了",
        );
      },
      { message: /已进入履约阶段/ },
    );
  });

  it("验收标准 7 (反向): 未排产时可正常取消", async () => {
    const { client } = createMockPrismaClient();
    const order = await createSalesOrder(
      client,
      {
        customerCode: "CUST-001",
        storeCode: "STOR-001",
        deliveryDate: "2026-10-01",
        items: [
          {
            itemCode: "ITEM-POTATO",
            itemName: "土豆丝",
            salesUnit: "kg",
            orderQty: 10,
          },
        ],
      },
      { userId: "USER-1" },
    );

    await cancelSalesOrder(
      client,
      order.orderId,
      { userId: "USER-1" },
      "客户改期",
    );
    const cancelled = await client.salesOrder.findUnique({
      where: { orderId: order.orderId },
    });
    assert.strictEqual(cancelled?.status, "CANCELLED");
    assert.strictEqual(cancelled?.lockStatus, "LOCKED");
    assert.match(cancelled?.remark || "", /取消原因: 客户改期/);
  });

  it("验收标准 4: 补单创建并关联原订单", async () => {
    const { client } = createMockPrismaClient();
    const original = await createSalesOrder(
      client,
      {
        customerCode: "CUST-001",
        storeCode: "STOR-001",
        deliveryDate: "2026-10-01",
        items: [
          {
            itemCode: "ITEM-POTATO",
            itemName: "土豆丝",
            salesUnit: "kg",
            orderQty: 50,
          },
        ],
      },
      { userId: "USER-1" },
    );

    const replenish = await createSalesOrder(
      client,
      {
        customerCode: "CUST-001",
        storeCode: "STOR-001",
        deliveryDate: "2026-10-01",
        orderType: "REPLENISHMENT",
        originalOrderId: original.orderId,
        items: [
          {
            itemCode: "ITEM-POTATO",
            itemName: "土豆丝",
            salesUnit: "kg",
            orderQty: 10,
          },
        ],
      },
      { userId: "USER-1" },
    );

    assert.strictEqual(replenish.orderType, "REPLENISHMENT");
    assert.strictEqual(replenish.originalOrderId, original.orderId);
  });

  it("验收标准 5: 订单费用独立复核", async () => {
    const { client, store } = createMockPrismaClient();
    const order = await createSalesOrder(
      client,
      {
        customerCode: "CUST-001",
        storeCode: "STOR-001",
        deliveryDate: "2026-10-01",
        items: [
          {
            itemCode: "ITEM-POTATO",
            itemName: "土豆丝",
            salesUnit: "kg",
            orderQty: 10,
          },
        ],
      },
      { userId: "USER-1" },
    );

    await addSalesOrderFee(
      client,
      order.orderId,
      { feeType: "FREIGHT", feeAmount: 35.0, remark: "冷链专送费" },
      { userId: "USER-1" },
    );

    assert.strictEqual(store.salesOrderFee.length, 1);
    const fee = store.salesOrderFee[0];
    assert.strictEqual(fee.feeType, "FREIGHT");
    assert.strictEqual(fee.feeAmount, 35.0);
    assert.strictEqual(fee.auditStatus, "DRAFT");

    // 复核费用
    await auditSalesOrderFee(client, fee.feeId, "APPROVED", {
      userId: "FINANCE-1",
    });
    const feeAfterAudit = store.salesOrderFee[0];
    assert.strictEqual(feeAfterAudit.auditStatus, "APPROVED");
    assert.strictEqual(feeAfterAudit.auditedById, "FINANCE-1");

    // 已复核不可再次修改
    await assert.rejects(
      async () => {
        await auditSalesOrderFee(client, fee.feeId, "REJECTED", {
          userId: "FINANCE-1",
        });
      },
      { message: /已复核通过的费用不可再次更改/ },
    );
  });

  it("一键发货标记: 已审核订单标记为 READY_TO_SHIP", async () => {
    const { client, store } = createMockPrismaClient();
    const order = await createSalesOrder(
      client,
      {
        customerCode: "CUST-001",
        storeCode: "STOR-001",
        deliveryDate: "2026-10-01",
        items: [
          {
            itemCode: "ITEM-POTATO",
            itemName: "土豆丝",
            salesUnit: "kg",
            orderQty: 10,
          },
        ],
      },
      { userId: "USER-1" },
    );

    // 草稿不可发货
    await assert.rejects(
      async () => {
        await markSalesOrderReadyToShip(client, order.orderId, {
          userId: "WH-1",
        });
      },
      { message: /只有已审核的订单才可执行一键发货/ },
    );

    // 审核后
    await auditSalesOrder(client, order.orderId, { userId: "AUDITOR-1" });
    await markSalesOrderReadyToShip(client, order.orderId, { userId: "WH-1" });

    assert.strictEqual(store.salesOrder[0].fulfillmentStatus, "READY_TO_SHIP");
  });

  it("listSalesOrders: 搜索客户名称 (如 '李四') 能够安全穿透反查并返回订单", async () => {
    const { client, store } = createMockPrismaClient();

    // 录入客户李四及订单
    store.customer.push({
      customerCode: "CUST-LISI",
      customerName: "李四餐馆",
      status: "ACTIVE",
      customerTags: "普通",
      defaultTaxRate: 9.0,
    });
    store.customerStore.push({
      storeCode: "STOR-LISI",
      customerCode: "CUST-LISI",
      storeName: "李四总店",
      regionCode: "REG-NORTH",
      status: "ACTIVE",
      defaultRoute: "ROUTE-B",
      defaultDriver: "DRIVER-2",
      deliveryPeriod: "NOON",
    });

    await createSalesOrder(
      client,
      {
        customerCode: "CUST-LISI",
        storeCode: "STOR-LISI",
        orderDate: "2026-03-12",
        deliveryDate: "2026-03-13",
        items: [
          {
            itemCode: "ITEM-POTATO",
            itemName: "土豆丝",
            salesUnit: "kg",
            orderQty: 5,
          },
        ],
      },
      { userId: "USER-1" },
    );

    // Mock count 和 findMany 条件过滤 (支持 Prisma 原生嵌套关系过滤)
    (client.salesOrder as any).count = async ({ where }: any) => {
      const orList = where?.OR ?? [];
      const matches = orList.some(
        (cond: any) =>
          cond.customer?.customerName?.contains === "李四" ||
          cond.customerCode?.in?.includes("CUST-LISI"),
      );
      return matches ? 1 : 0;
    };
    (client.salesOrder as any).findMany = async ({ where }: any) => {
      const orList = where?.OR ?? [];
      const matches = orList.some(
        (cond: any) =>
          cond.customer?.customerName?.contains === "李四" ||
          cond.customerCode?.in?.includes("CUST-LISI"),
      );
      if (matches) {
        return store.salesOrder
          .filter((o) => o.customerCode === "CUST-LISI")
          .map((o) => ({ ...o, _count: { items: 1 } }));
      }
      return [];
    };

    // 针对客户名称反查
    (client.customer as any).findMany = async ({ where }: any) => {
      const contains = where?.customerName?.contains;
      if (contains) {
        return store.customer.filter((c) => c.customerName.includes(contains));
      }
      return store.customer;
    };
    (client.customerStore as any).findMany = async ({ where }: any) => {
      const contains = where?.storeName?.contains;
      if (contains) {
        return store.customerStore.filter((s) =>
          s.storeName.includes(contains),
        );
      }
      return store.customerStore;
    };

    // 搜索关键字 "李四"
    const result = await listSalesOrders(client, {
      page: 1,
      pageSize: 10,
      keyword: "李四",
    });

    assert.strictEqual(result.total, 1);
    assert.strictEqual(result.items[0].customerName, "李四餐馆");
  });
});
