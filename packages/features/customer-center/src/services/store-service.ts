import type { CustomerPrismaClient } from "../db/client";

export interface CreateStoreInput {
  customerCode: string;
  storeName: string;
  address: string;
  contactPerson: string;
  contactPhone: string;
  regionCode: string;
  deliveryPeriod?: string | null;
  defaultRoute?: string | null;
  defaultDriver?: string | null;
  storeTags?: string | null;
  billingContact?: string | null;
  billingPhone?: string | null;
}

export interface UpdateStoreInput extends Partial<CreateStoreInput> {
  status?: "ACTIVE" | "DISABLED";
}

export interface ListStoreFilter {
  customerCode?: string;
  regionCode?: string;
  status?: string;
  keyword?: string;
}

export class CustomerStoreService {
  /**
   * 生成唯一且递增的门店编码: STOR-YYYYMMDD-XXXX
   */
  static async generateStoreCode(
    client: CustomerPrismaClient,
  ): Promise<string> {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const datePrefix = `STOR-${yyyy}${mm}${dd}-`;

    const latest = await client.customerStore.findFirst({
      where: {
        storeCode: {
          startsWith: datePrefix,
        },
      },
      orderBy: { storeCode: "desc" },
      select: { storeCode: true },
    });

    let seq = 1;
    if (latest) {
      const parts = latest.storeCode.split("-");
      const lastSeq = parseInt(parts[2] || "0", 10);
      if (!isNaN(lastSeq)) {
        seq = lastSeq + 1;
      }
    }

    return `${datePrefix}${String(seq).padStart(4, "0")}`;
  }

  /**
   * 门店列表查询
   */
  static async listStores(
    client: CustomerPrismaClient,
    filter: ListStoreFilter = {},
  ) {
    const where: any = {};

    if (filter.customerCode) {
      where.customerCode = filter.customerCode;
    }
    if (filter.regionCode) {
      where.regionCode = filter.regionCode;
    }
    if (filter.status) {
      where.status = filter.status;
    }
    if (filter.keyword) {
      where.OR = [
        { storeName: { contains: filter.keyword } },
        { storeCode: { contains: filter.keyword } },
        { address: { contains: filter.keyword } },
        { contactPerson: { contains: filter.keyword } },
        { contactPhone: { contains: filter.keyword } },
      ];
    }

    return client.customerStore.findMany({
      where,
      include: {
        customer: {
          select: {
            customerCode: true,
            customerName: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * 创建门店档案
   */
  static async createStore(
    client: CustomerPrismaClient,
    input: CreateStoreInput,
  ) {
    // 必须关联已存在的有效客户档案
    const customer = await client.customer.findUnique({
      where: { customerCode: input.customerCode },
    });
    if (!customer) {
      throw new Error(`所属客户 [${input.customerCode}] 不存在`);
    }
    if (customer.status === "DISABLED") {
      throw new Error(
        `所属客户 [${customer.customerName}] 已停用，无法为其新建门店`,
      );
    }

    if (!input.regionCode || input.regionCode.trim().length === 0) {
      throw new Error("所属区域编码 (regionCode) 为必填项，用于区域报价匹配");
    }

    const storeCode = await CustomerStoreService.generateStoreCode(client);

    return client.customerStore.create({
      data: {
        storeCode,
        customerCode: input.customerCode,
        storeName: input.storeName,
        address: input.address,
        contactPerson: input.contactPerson,
        contactPhone: input.contactPhone,
        regionCode: input.regionCode,
        deliveryPeriod: input.deliveryPeriod || null,
        defaultRoute: input.defaultRoute || null,
        defaultDriver: input.defaultDriver || null,
        storeTags: input.storeTags || null,
        billingContact: input.billingContact || null,
        billingPhone: input.billingPhone || null,
        status: "ACTIVE",
      },
      include: {
        customer: true,
      },
    });
  }

  /**
   * 更新门店档案
   */
  static async updateStore(
    client: CustomerPrismaClient,
    storeCode: string,
    input: UpdateStoreInput,
  ) {
    const existing = await client.customerStore.findUnique({
      where: { storeCode },
    });
    if (!existing) {
      throw new Error(`门店 [${storeCode}] 不存在`);
    }

    if (
      input.regionCode !== undefined &&
      (!input.regionCode || input.regionCode.trim().length === 0)
    ) {
      throw new Error("所属区域编码 (regionCode) 不能为空");
    }

    return client.customerStore.update({
      where: { storeCode },
      data: {
        storeName: input.storeName,
        address: input.address,
        contactPerson: input.contactPerson,
        contactPhone: input.contactPhone,
        regionCode: input.regionCode,
        deliveryPeriod: input.deliveryPeriod,
        defaultRoute: input.defaultRoute,
        defaultDriver: input.defaultDriver,
        storeTags: input.storeTags,
        billingContact: input.billingContact,
        billingPhone: input.billingPhone,
        status: input.status,
      },
      include: {
        customer: true,
      },
    });
  }

  /**
   * 变更门店状态
   */
  static async updateStoreStatus(
    client: CustomerPrismaClient,
    storeCode: string,
    status: "ACTIVE" | "DISABLED",
  ) {
    const store = await client.customerStore.findUnique({
      where: { storeCode },
      include: { customer: true },
    });
    if (!store) {
      throw new Error(`门店 [${storeCode}] 不存在`);
    }

    // 若试图启用门店，需确保客户也是启用状态
    if (status === "ACTIVE" && store.customer.status === "DISABLED") {
      throw new Error(
        `所属客户 [${store.customer.customerName}] 处于停用状态，无法单独启用该门店`,
      );
    }

    return client.customerStore.update({
      where: { storeCode },
      data: { status },
    });
  }

  /**
   * 删除门店（已有报价单或订单的门店不允许删除）
   */
  static async deleteStore(client: CustomerPrismaClient, storeCode: string) {
    const quoteCount = await client.customerQuote.count({
      where: { storeCode },
    });
    if (quoteCount > 0) {
      throw new Error(`该门店已存在关联报价单记录，禁止删除，请进行“停用”操作`);
    }

    return client.customerStore.delete({
      where: { storeCode },
    });
  }
}
