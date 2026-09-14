import type { TenantPrismaClient, TenantPrisma } from "@base/db-tenant";
import { formatBusinessDocNo } from "@base/biz-shared";
import { MasterDataStatus } from "@base/shared";
import type {
  CreateSalesOrderInput,
  AddOrderFeeInput,
  ListSalesOrdersParams,
  FeeAuditStatus,
  PaginatedSalesOrders,
  SalesOrderDetail,
  SalesOrderListItem,
} from "./types";

interface OperatorContext {
  userId: string;
  deptId?: string | null;
}

/**
 * 自动寻找客户 + 门店 + 商品的最优生效报价
 * 匹配优先级：门店专属报价 > 客户通用报价 > 区域通用报价
 */
export async function findEffectiveQuotationPrice(
  client: TenantPrismaClient,
  params: {
    customerCode: string;
    storeCode: string;
    itemCode: string;
    targetDate?: Date;
  },
): Promise<{
  unitPriceExclTax: number;
  unitPriceInclTax: number;
  taxRate: number;
} | null> {
  const targetDate = params.targetDate ?? new Date();

  // 1. 查找门店信息获取 regionCode
  const store = await client.customerStore.findUnique({
    where: { storeCode: params.storeCode },
    select: { regionCode: true, status: true },
  });

  if (!store || store.status !== MasterDataStatus.ACTIVE) {
    // 门店不存在或停用
    return null;
  }

  // 2. 检索所有符合日期与状态范围的报价单（优先匹配门店、再客户、再区域）
  const activeQuotes = await client.customerQuote.findMany({
    where: {
      status: MasterDataStatus.ACTIVE,
      isDeleted: false,
      effectiveDate: { lte: targetDate },
      OR: [{ expiryDate: null }, { expiryDate: { gte: targetDate } }],
      AND: [
        {
          OR: [
            { storeCode: params.storeCode },
            { customerCode: params.customerCode, storeCode: null },
            {
              regionCode: store.regionCode,
              customerCode: null,
              storeCode: null,
            },
          ],
        },
      ],
    },
    include: {
      items: {
        where: { itemCode: params.itemCode },
      },
    },
  });

  // 按优先级排序：
  // 1. storeCode 命中 (精确到门店)
  // 2. customerCode 命中 (客户通用)
  // 3. regionCode 命中 (区域通用)
  let bestItem: (typeof activeQuotes)[0]["items"][0] | null = null;
  let highestPriority = -1;

  for (const quote of activeQuotes) {
    if (quote.items.length === 0) continue;
    let priority = 0;
    if (quote.storeCode === params.storeCode) {
      priority = 3;
    } else if (quote.customerCode === params.customerCode) {
      priority = 2;
    } else if (quote.regionCode === store.regionCode) {
      priority = 1;
    }

    if (priority > highestPriority) {
      highestPriority = priority;
      bestItem = quote.items[0];
    }
  }

  if (!bestItem) return null;

  return {
    unitPriceExclTax: Number(bestItem.unitPriceExclTax),
    unitPriceInclTax: Number(bestItem.unitPriceInclTax),
    taxRate: bestItem.taxRate ? Number(bestItem.taxRate) : 0,
  };
}

/**
 * 创建销售订单（支持普通订单与补货订单）
 */
export async function createSalesOrder(
  client: TenantPrismaClient,
  input: CreateSalesOrderInput,
  operator: OperatorContext,
): Promise<SalesOrderDetail> {
  // 1. 校验客户与门店状态
  const customer = await client.customer.findUnique({
    where: { customerCode: input.customerCode },
    select: {
      status: true,
      customerName: true,
      customerTags: true,
      defaultTaxRate: true,
    },
  });
  if (!customer || customer.status !== MasterDataStatus.ACTIVE) {
    throw new Error(`客户不存在或已停用: ${input.customerCode}`);
  }

  const store = await client.customerStore.findUnique({
    where: { storeCode: input.storeCode },
    select: {
      status: true,
      storeName: true,
      defaultRoute: true,
      defaultDriver: true,
      deliveryPeriod: true,
    },
  });
  if (!store || store.status !== MasterDataStatus.ACTIVE) {
    throw new Error(`门店不存在或已停用: ${input.storeCode}`);
  }

  // 2. 日期校验：交货日期必须大于或等于下单日期
  const orderDate = input.orderDate ? new Date(input.orderDate) : new Date();
  const deliveryDate = new Date(input.deliveryDate);
  if (deliveryDate < orderDate) {
    throw new Error("交货日期必须晚于或等于下单日期");
  }

  // 3. 补单逻辑与原订单校验
  if (input.orderType === "REPLENISHMENT" && input.originalOrderId) {
    const origOrder = await client.salesOrder.findUnique({
      where: { orderId: input.originalOrderId },
    });
    if (!origOrder) {
      throw new Error(`关联的原订单不存在: ${input.originalOrderId}`);
    }
  }

  // 4. 明细校验与价格自动带出
  if (!input.items || input.items.length === 0) {
    throw new Error("订单明细不能为空");
  }

  const processedItems = await Promise.all(
    input.items.map(async (item) => {
      if (item.orderQty <= 0) {
        throw new Error(`商品 ${item.itemName} 订购数量必须大于 0`);
      }

      let priceIncl = item.unitPriceInclTax;
      let priceExcl = item.unitPriceExclTax;
      let taxRate =
        item.taxRate ??
        (customer.defaultTaxRate ? Number(customer.defaultTaxRate) : 0);

      // 如果未传入价格，尝试自动读取生效报价
      if (priceIncl === undefined || priceExcl === undefined) {
        const quote = await findEffectiveQuotationPrice(client, {
          customerCode: input.customerCode,
          storeCode: input.storeCode,
          itemCode: item.itemCode,
          targetDate: orderDate,
        });
        if (quote) {
          priceIncl = quote.unitPriceInclTax;
          priceExcl = quote.unitPriceExclTax;
          taxRate = quote.taxRate;
        } else {
          priceIncl = priceIncl ?? 0;
          priceExcl = priceExcl ?? 0;
        }
      }

      const subtotal = Math.round(item.orderQty * priceIncl * 100) / 100;

      return {
        ...item,
        unitPriceInclTax: priceIncl,
        unitPriceExclTax: priceExcl,
        taxRate,
        subtotalAmount: subtotal,
      };
    }),
  );

  const totalAmount = processedItems.reduce(
    (sum, item) => sum + item.subtotalAmount,
    0,
  );

  // 5. 生成销售订单号 SO-YYYYMMDD-XXXX
  const today = new Date();
  const yyyymmdd = today.toISOString().slice(0, 10).replace(/-/g, "");
  const prefix = `SO-${yyyymmdd}-`;
  const latest = await client.salesOrder.findFirst({
    where: { orderId: { startsWith: prefix } },
    orderBy: { orderId: "desc" },
    select: { orderId: true },
  });
  let seq = 1;
  if (latest) {
    const parts = latest.orderId.split("-");
    const lastSeq = parseInt(parts[2] || "0", 10);
    if (!isNaN(lastSeq)) seq = lastSeq + 1;
  }
  const orderId = formatBusinessDocNo("SO", seq, today);

  // 6. 事务落库
  const result = await client.$transaction(async (tx) => {
    const order = await tx.salesOrder.create({
      data: {
        orderId,
        customerCode: input.customerCode,
        storeCode: input.storeCode,
        orderDate,
        deliveryDate,
        salesPerson: input.salesPerson,
        customerTags: customer.customerTags,
        department: input.department,
        mealPeriod: input.mealPeriod ?? store.deliveryPeriod,
        orderSource: "MANUAL",
        orderType: input.orderType ?? "NORMAL",
        originalOrderId: input.originalOrderId,
        sortingRemark: input.sortingRemark,
        routeCode: input.routeCode ?? store.defaultRoute,
        driverCode: input.driverCode ?? store.defaultDriver,
        lockStatus: "UNLOCKED",
        status: "DRAFT",
        fulfillmentStatus: "PENDING_SUMMARY",
        settlementStatus: "UNRECONCILED",
        totalAmount,
        remark: input.remark,
        createdById: operator.userId,
        deptId: operator.deptId,
      },
    });

    let index = 1;
    for (const item of processedItems) {
      const detailId = `${orderId}-${String(index++).padStart(2, "0")}`;
      await tx.salesOrderItem.create({
        data: {
          orderDetailId: detailId,
          orderId,
          itemCode: item.itemCode,
          itemName: item.itemName,
          salesUnit: item.salesUnit,
          orderQty: item.orderQty,
          fulfillmentStatus: "PENDING_PRODUCE",
          unitPriceExclTax: item.unitPriceExclTax,
          unitPriceInclTax: item.unitPriceInclTax,
          taxRate: item.taxRate,
          subtotalAmount: item.subtotalAmount,
          remark: item.remark,
        },
      });
    }

    return order;
  });

  return getSalesOrderDetail(client, result.orderId);
}

/**
 * 审核销售订单
 * 规则：草稿/待审核 -> 已审核。进入待汇总状态。审核后锁定。
 */
export async function auditSalesOrder(
  client: TenantPrismaClient,
  orderId: string,
  operator: OperatorContext,
): Promise<void> {
  const order = await client.salesOrder.findUnique({
    where: { orderId },
  });
  if (!order || order.isDeleted) {
    throw new Error(`订单不存在: ${orderId}`);
  }
  if (order.status === "APPROVED") {
    throw new Error("订单已处于已审核状态");
  }
  if (order.status === "CANCELLED") {
    throw new Error("已取消的订单不可审核");
  }

  await client.salesOrder.update({
    where: { orderId },
    data: {
      status: "APPROVED",
      lockStatus: "LOCKED",
      updatedById: operator.userId,
    },
  });
}

/**
 * 取消销售订单
 * 规则：生产中或之后不允许取消；已审核不可修改，可取消
 */
export async function cancelSalesOrder(
  client: TenantPrismaClient,
  orderId: string,
  operator: OperatorContext,
  reason?: string,
): Promise<void> {
  const order = await client.salesOrder.findUnique({
    where: { orderId },
  });
  if (!order || order.isDeleted) {
    throw new Error(`订单不存在: ${orderId}`);
  }

  if (order.status === "CANCELLED") {
    throw new Error("订单已经是取消状态");
  }

  // 生产中、生产完成、可发货、已分拣、已出库等均不允许取消
  const nonCancellableFulfillment = [
    "PRODUCING",
    "PRODUCED",
    "READY_TO_SHIP",
    "SORTED",
    "SHIPPED",
    "LOADED",
    "DELIVERING",
    "SIGNED",
  ];
  if (nonCancellableFulfillment.includes(order.fulfillmentStatus)) {
    throw new Error(
      `订单已进入履约阶段 (${order.fulfillmentStatus})，不允许取消订单`,
    );
  }

  const formattedRemark = reason
    ? order.remark
      ? `${order.remark}; 取消原因: ${reason}`
      : `取消原因: ${reason}`
    : order.remark;

  await client.salesOrder.update({
    where: { orderId },
    data: {
      status: "CANCELLED",
      lockStatus: "LOCKED",
      remark: formattedRemark,
      updatedById: operator.userId,
    },
  });
}

/**
 * 一键发货标记（库管员操作，将 fulfillmentStatus 标记为 READY_TO_SHIP 可发货）
 */
export async function markSalesOrderReadyToShip(
  client: TenantPrismaClient,
  orderId: string,
  operator: OperatorContext,
): Promise<void> {
  const order = await client.salesOrder.findUnique({
    where: { orderId },
  });
  if (!order || order.isDeleted) {
    throw new Error(`订单不存在: ${orderId}`);
  }
  if (order.status !== "APPROVED") {
    throw new Error("只有已审核的订单才可执行一键发货标记");
  }

  await client.salesOrder.update({
    where: { orderId },
    data: {
      fulfillmentStatus: "READY_TO_SHIP",
      updatedById: operator.userId,
    },
  });
}

/**
 * 添加订单费用明细
 */
export async function addSalesOrderFee(
  client: TenantPrismaClient,
  orderId: string,
  input: AddOrderFeeInput,
  operator: OperatorContext,
): Promise<void> {
  const order = await client.salesOrder.findUnique({
    where: { orderId },
  });
  if (!order || order.isDeleted) {
    throw new Error(`订单不存在: ${orderId}`);
  }

  const feeCount = await client.salesOrderFee.count({
    where: { orderId },
  });
  const feeId = `SOF-${orderId.replace("SO-", "")}-${String(feeCount + 1).padStart(2, "0")}`;

  await client.salesOrderFee.create({
    data: {
      feeId,
      orderId,
      feeType: input.feeType,
      feeAmount: input.feeAmount,
      remark: input.remark,
      auditStatus: "DRAFT",
      createdById: operator.userId,
    },
  });
}

/**
 * 费用复核（审核或驳回）
 */
export async function auditSalesOrderFee(
  client: TenantPrismaClient,
  feeId: string,
  auditStatus: "APPROVED" | "REJECTED",
  operator: OperatorContext,
): Promise<void> {
  const fee = await client.salesOrderFee.findUnique({
    where: { feeId },
  });
  if (!fee) {
    throw new Error(`费用记录不存在: ${feeId}`);
  }
  if (fee.auditStatus === "APPROVED") {
    throw new Error("已复核通过的费用不可再次更改");
  }

  await client.salesOrderFee.update({
    where: { feeId },
    data: {
      auditStatus,
      auditedById: operator.userId,
      auditedAt: new Date(),
    },
  });
}

/**
 * 删除草稿订单（软删除）
 */
export async function deleteSalesOrder(
  client: TenantPrismaClient,
  orderId: string,
  operator: OperatorContext,
): Promise<void> {
  const order = await client.salesOrder.findUnique({
    where: { orderId },
  });
  if (!order || order.isDeleted) {
    throw new Error(`订单不存在: ${orderId}`);
  }
  if (order.status === "APPROVED") {
    throw new Error("已审核订单不允许删除，只能取消");
  }

  await client.salesOrder.update({
    where: { orderId },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
      deletedById: operator.userId,
    },
  });
}

/**
 * 获取销售订单详情
 */
export async function getSalesOrderDetail(
  client: TenantPrismaClient,
  orderId: string,
): Promise<SalesOrderDetail> {
  const order = await client.salesOrder.findUnique({
    where: { orderId },
    include: {
      items: true,
      fees: true,
    },
  });
  if (!order || order.isDeleted) {
    throw new Error(`订单不存在: ${orderId}`);
  }

  const [customer, store] = await Promise.all([
    client.customer.findUnique({
      where: { customerCode: order.customerCode },
      select: { customerName: true },
    }),
    client.customerStore.findUnique({
      where: { storeCode: order.storeCode },
      select: { storeName: true },
    }),
  ]);

  return {
    orderId: order.orderId,
    customerCode: order.customerCode,
    storeCode: order.storeCode,
    customerName: customer?.customerName ?? order.customerCode,
    storeName: store?.storeName ?? order.storeCode,
    orderDate: order.orderDate.toISOString().split("T")[0],
    deliveryDate: order.deliveryDate.toISOString().split("T")[0],
    salesPerson: order.salesPerson,
    customerTags: order.customerTags,
    department: order.department,
    mealPeriod: order.mealPeriod,
    orderSource: order.orderSource,
    orderType: order.orderType,
    originalOrderId: order.originalOrderId,
    sortingRemark: order.sortingRemark,
    routeCode: order.routeCode,
    driverCode: order.driverCode,
    lockStatus: order.lockStatus,
    status: order.status,
    fulfillmentStatus: order.fulfillmentStatus,
    settlementStatus: order.settlementStatus,
    outboundStatus: order.outboundStatus,
    receiptStatus: order.receiptStatus,
    printStatus: order.printStatus,
    totalAmount: Number(order.totalAmount),
    remark: order.remark,
    itemCount: order.items.length,
    createdById: order.createdById,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    items: order.items.map((i) => ({
      orderDetailId: i.orderDetailId,
      itemCode: i.itemCode,
      itemName: i.itemName,
      salesUnit: i.salesUnit,
      orderQty: Number(i.orderQty),
      inboundQty: Number(i.inboundQty),
      signedQty: i.signedQty ? Number(i.signedQty) : undefined,
      fulfillmentStatus: i.fulfillmentStatus,
      unitPriceExclTax: Number(i.unitPriceExclTax),
      unitPriceInclTax: Number(i.unitPriceInclTax),
      taxRate: i.taxRate ? Number(i.taxRate) : 0,
      subtotalAmount: Number(i.subtotalAmount),
      remark: i.remark,
    })),
    fees: order.fees.map((f) => ({
      feeId: f.feeId,
      orderId: f.orderId,
      feeType: f.feeType,
      feeAmount: Number(f.feeAmount),
      remark: f.remark,
      auditStatus: f.auditStatus as FeeAuditStatus,
      createdById: f.createdById,
      auditedById: f.auditedById,
      auditedAt: f.auditedAt ? f.auditedAt.toISOString() : null,
      createdAt: f.createdAt.toISOString(),
    })),
  };
}

/**
 * 分页查询销售订单列表
 */
export async function listSalesOrders(
  client: TenantPrismaClient,
  params: ListSalesOrdersParams,
  dataScopeFilter?: TenantPrisma.SalesOrderWhereInput,
): Promise<PaginatedSalesOrders> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.max(1, Math.min(100, params.pageSize ?? 10));
  const skip = (page - 1) * pageSize;

  const where: TenantPrisma.SalesOrderWhereInput = {
    isDeleted: false,
    ...dataScopeFilter,
  };

  if (params.customerCode) {
    where.customerCode = params.customerCode;
  }
  if (params.storeCode) {
    where.storeCode = params.storeCode;
  }
  if (params.status) {
    where.status = params.status;
  }
  if (params.fulfillmentStatus) {
    where.fulfillmentStatus = params.fulfillmentStatus;
  }
  if (params.settlementStatus) {
    where.settlementStatus = params.settlementStatus;
  }
  if (params.orderType) {
    where.orderType = params.orderType;
  }
  if (params.startDate || params.endDate) {
    where.orderDate = {};
    if (params.startDate) where.orderDate.gte = new Date(params.startDate);
    if (params.endDate) where.orderDate.lte = new Date(params.endDate);
  }

  if (params.keyword) {
    where.OR = [
      { orderId: { contains: params.keyword, mode: "insensitive" } },
      { customerCode: { contains: params.keyword, mode: "insensitive" } },
      { storeCode: { contains: params.keyword, mode: "insensitive" } },
      { salesPerson: { contains: params.keyword, mode: "insensitive" } },
    ];
  }

  const [total, orders] = await Promise.all([
    client.salesOrder.count({ where }),
    client.salesOrder.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { items: true },
        },
      },
    }),
  ]);

  // 获取关联客户和门店名称
  const customerCodes = Array.from(new Set(orders.map((o) => o.customerCode)));
  const storeCodes = Array.from(new Set(orders.map((o) => o.storeCode)));

  const [customers, stores] = await Promise.all([
    client.customer.findMany({
      where: { customerCode: { in: customerCodes } },
      select: { customerCode: true, customerName: true },
    }),
    client.customerStore.findMany({
      where: { storeCode: { in: storeCodes } },
      select: { storeCode: true, storeName: true },
    }),
  ]);

  const customerMap = new Map(
    customers.map((c) => [c.customerCode, c.customerName]),
  );
  const storeMap = new Map(stores.map((s) => [s.storeCode, s.storeName]));

  const items: SalesOrderListItem[] = orders.map((o) => ({
    orderId: o.orderId,
    customerCode: o.customerCode,
    storeCode: o.storeCode,
    customerName: customerMap.get(o.customerCode) ?? o.customerCode,
    storeName: storeMap.get(o.storeCode) ?? o.storeCode,
    orderDate: o.orderDate.toISOString().split("T")[0],
    deliveryDate: o.deliveryDate.toISOString().split("T")[0],
    salesPerson: o.salesPerson,
    customerTags: o.customerTags,
    department: o.department,
    mealPeriod: o.mealPeriod,
    orderSource: o.orderSource,
    orderType: o.orderType,
    originalOrderId: o.originalOrderId,
    sortingRemark: o.sortingRemark,
    routeCode: o.routeCode,
    driverCode: o.driverCode,
    lockStatus: o.lockStatus,
    status: o.status,
    fulfillmentStatus: o.fulfillmentStatus,
    settlementStatus: o.settlementStatus,
    outboundStatus: o.outboundStatus,
    receiptStatus: o.receiptStatus,
    printStatus: o.printStatus,
    totalAmount: Number(o.totalAmount),
    remark: o.remark,
    itemCount: o._count.items,
    createdById: o.createdById,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
  }));

  return {
    items,
    total,
    page,
    pageSize,
  };
}
