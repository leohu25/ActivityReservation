import type { TenantPrismaClient } from "@base/db-tenant";
import type { PrismaQueryCondition } from "@base/authorization";
import type {
  CreateStoreInput,
  ListStoreFilter,
  UpdateStoreInput,
} from "./types";

export type StorePrismaItem = Awaited<
  ReturnType<TenantPrismaClient["customerStore"]["findMany"]>
>[number] & {
  customer?: {
    customerCode: string;
    customerName: string;
    status: string;
  } | null;
};

export interface ListStoresResult {
  items: StorePrismaItem[];
  total: number;
  page: number;
  pageSize: number;
}

export class CustomerStoreService {
  /**
   * 生成唯一且递增的门店编码: STOR-YYYYMMDD-XXXX
   */
  static async generateStoreCode(client: TenantPrismaClient): Promise<string> {
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
   * 门店列表查询（服务端分页：count + skip/take，严格过滤软删除并下推行级数据范围）
   */
  static async listStores(
    client: TenantPrismaClient,
    filter: ListStoreFilter = {},
    accessibleWhere?: PrismaQueryCondition,
  ): Promise<ListStoresResult> {
    const page = Math.max(1, filter.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, filter.pageSize ?? 10));
    const skip = (page - 1) * pageSize;

    const andConditions: any[] = [{ isDeleted: false }];

    if (accessibleWhere && Object.keys(accessibleWhere).length > 0) {
      andConditions.push(accessibleWhere);
    }

    if (filter.customerCode) {
      andConditions.push({ customerCode: filter.customerCode });
    }
    if (filter.regionCode) {
      andConditions.push({ regionCode: filter.regionCode });
    }
    if (filter.status) {
      andConditions.push({ status: filter.status });
    }
    if (filter.keyword) {
      andConditions.push({
        OR: [
          { storeName: { contains: filter.keyword } },
          { storeCode: { contains: filter.keyword } },
          { address: { contains: filter.keyword } },
          { contactPerson: { contains: filter.keyword } },
          { contactPhone: { contains: filter.keyword } },
        ],
      });
    }

    const where = { AND: andConditions };

    const [total, items] = await Promise.all([
      client.customerStore.count({ where }),
      client.customerStore.findMany({
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
        skip,
        take: pageSize,
      }),
    ]);

    return { items, total, page, pageSize };
  }

  /**
   * 获取单条门店详情
   */
  static async getStore(
    client: TenantPrismaClient,
    storeCode: string,
    accessibleWhere?: PrismaQueryCondition,
  ) {
    const andConditions: any[] = [{ storeCode }, { isDeleted: false }];
    if (accessibleWhere && Object.keys(accessibleWhere).length > 0) {
      andConditions.push(accessibleWhere);
    }

    return client.customerStore.findFirst({
      where: { AND: andConditions },
      include: {
        customer: true,
        quotes: {
          where: { isDeleted: false },
          select: {
            quoteId: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });
  }

  /**
   * 创建门店档案
   */
  static async createStore(
    client: TenantPrismaClient,
    input: CreateStoreInput,
    auditCtx: { userId: string; deptId?: string | null },
  ) {
    // 必须关联已存在的有效客户档案
    const customer = await client.customer.findUnique({
      where: { customerCode: input.customerCode },
    });
    if (!customer || customer.isDeleted) {
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
        createdById: auditCtx.userId,
        deptId: auditCtx.deptId ?? null,
        isDeleted: false,
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
    client: TenantPrismaClient,
    storeCode: string,
    input: UpdateStoreInput,
    auditCtx?: { userId: string },
  ) {
    const existing = await client.customerStore.findUnique({
      where: { storeCode },
    });
    if (!existing || existing.isDeleted) {
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
        updatedById: auditCtx?.userId ?? null,
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
    client: TenantPrismaClient,
    storeCode: string,
    status: "ACTIVE" | "DISABLED",
    auditCtx?: { userId: string },
  ) {
    const store = await client.customerStore.findUnique({
      where: { storeCode },
      include: { customer: true },
    });
    if (!store || store.isDeleted) {
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
      data: {
        status,
        updatedById: auditCtx?.userId ?? null,
      },
    });
  }

  /**
   * 软删除门店（已有报价单或订单的门店不允许删除）
   */
  static async deleteStore(
    client: TenantPrismaClient,
    storeCode: string,
    auditCtx?: { userId: string },
  ) {
    const quoteCount = await client.customerQuote.count({
      where: { storeCode, isDeleted: false },
    });
    if (quoteCount > 0) {
      throw new Error(`该门店已存在关联报价单记录，禁止删除，请进行“停用”操作`);
    }

    return client.customerStore.update({
      where: { storeCode },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedById: auditCtx?.userId ?? null,
      },
    });
  }
}
