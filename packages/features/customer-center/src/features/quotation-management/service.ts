import { randomUUID } from "node:crypto";
import type { TenantPrismaClient } from "@base/db-tenant";
import type { PrismaQueryCondition } from "@base/authorization";
import type {
  CreateQuoteInput,
  UpdateQuoteInput,
  ListQuoteFilter,
} from "./types";

export interface ListQuotesResult {
  items: Awaited<ReturnType<TenantPrismaClient["customerQuote"]["findMany"]>>;
  total: number;
  page: number;
  pageSize: number;
}

export class CustomerQuoteService {
  /**
   * 生成报价单单号: QUOT-YYYYMMDD-XXXX
   */
  static async generateQuoteId(client: TenantPrismaClient): Promise<string> {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const datePrefix = `QUOT-${yyyy}${mm}${dd}-`;

    const latest = await client.customerQuote.findFirst({
      where: {
        quoteId: {
          startsWith: datePrefix,
        },
      },
      orderBy: { quoteId: "desc" },
      select: { quoteId: true },
    });

    let seq = 1;
    if (latest) {
      const parts = latest.quoteId.split("-");
      const lastSeq = parseInt(parts[2] || "0", 10);
      if (!isNaN(lastSeq)) {
        seq = lastSeq + 1;
      }
    }

    return `${datePrefix}${String(seq).padStart(4, "0")}`;
  }

  /**
   * 报价单列表查询（服务端分页：严格过滤软删除并下推行级数据范围）
   */
  static async listQuotes(
    client: TenantPrismaClient,
    filter: ListQuoteFilter = {},
    accessibleWhere?: PrismaQueryCondition,
  ): Promise<ListQuotesResult> {
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
    if (filter.storeCode) {
      andConditions.push({ storeCode: filter.storeCode });
    }
    if (filter.regionCode) {
      andConditions.push({ regionCode: filter.regionCode });
    }
    if (filter.status) {
      andConditions.push({ status: filter.status });
    }

    const where = { AND: andConditions };

    const [total, items] = await Promise.all([
      client.customerQuote.count({ where }),
      client.customerQuote.findMany({
        where,
        include: {
          customer: {
            select: {
              customerCode: true,
              customerName: true,
            },
          },
          store: {
            select: {
              storeCode: true,
              storeName: true,
            },
          },
          items: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
    ]);

    return { items, total, page, pageSize };
  }

  /**
   * 创建报价单（包含明细行，初始状态为 DRAFT）
   */
  static async createQuote(
    client: TenantPrismaClient,
    input: CreateQuoteInput,
    auditCtx?: { userId: string; deptId?: string | null },
  ) {
    if (!input.customerCode && !input.storeCode && !input.regionCode) {
      throw new Error("报价单适用范围必须指定客户、门店或区域中的至少一项");
    }

    if (!input.items || input.items.length === 0) {
      throw new Error("报价单必须至少包含一条商品明细");
    }

    const quoteId = await CustomerQuoteService.generateQuoteId(client);

    return client.$transaction(async (tx) => {
      const quote = await tx.customerQuote.create({
        data: {
          quoteId,
          customerCode: input.customerCode || null,
          storeCode: input.storeCode || null,
          regionCode: input.regionCode || null,
          quoteDate: new Date(input.quoteDate),
          effectiveDate: new Date(input.effectiveDate),
          expiryDate: input.expiryDate ? new Date(input.expiryDate) : null,
          quoteType: input.quoteType || "STANDARD",
          displayName: input.displayName || null,
          itemCount: input.items.length,
          customerCount: input.customerCode ? 1 : 0,
          status: "DRAFT",
          createdBy: input.createdBy,
          createdById: auditCtx?.userId ?? input.createdBy,
          deptId: auditCtx?.deptId ?? null,
          isDeleted: false,
        },
      });

      await tx.customerQuoteItem.createMany({
        data: input.items.map((item) => ({
          quoteDetailId: randomUUID(),
          quoteId,
          itemCode: item.itemCode,
          itemName: item.itemName,
          salesUnit: item.salesUnit,
          unitPriceExclTax: item.unitPriceExclTax,
          unitPriceInclTax: item.unitPriceInclTax,
          taxRate: item.taxRate,
          minQty: item.minQty ?? null,
          maxQty: item.maxQty ?? null,
          remark: item.remark || null,
        })),
      });

      return quote;
    });
  }

  /**
   * 修改草稿报价单：仅 DRAFT 状态允许修改，并在事务中覆写品项清单
   */
  static async updateQuote(
    client: TenantPrismaClient,
    quoteId: string,
    input: UpdateQuoteInput,
    auditCtx?: { userId: string },
  ) {
    const existing = await client.customerQuote.findUnique({
      where: { quoteId },
    });
    if (!existing || existing.isDeleted) {
      throw new Error(`报价单 [${quoteId}] 不存在`);
    }
    if (existing.status !== "DRAFT") {
      throw new Error(`仅“草稿”状态的报价单允许编辑基础信息与品项`);
    }
    if (!input.customerCode && !input.storeCode && !input.regionCode) {
      throw new Error("报价单适用范围必须指定客户、门店或区域中的至少一项");
    }
    if (!input.items || input.items.length === 0) {
      throw new Error("报价单必须至少包含一条商品明细");
    }

    return client.$transaction(async (tx) => {
      const updated = await tx.customerQuote.update({
        where: { quoteId },
        data: {
          customerCode: input.customerCode || null,
          storeCode: input.storeCode || null,
          regionCode: input.regionCode || null,
          effectiveDate: new Date(input.effectiveDate),
          expiryDate: input.expiryDate ? new Date(input.expiryDate) : null,
          displayName: input.displayName || null,
          itemCount: input.items.length,
          customerCount: input.customerCode ? 1 : 0,
          updatedById: auditCtx?.userId ?? null,
        },
      });

      // 覆写子表：先清理已有明细再批量重建
      await tx.customerQuoteItem.deleteMany({
        where: { quoteId },
      });

      await tx.customerQuoteItem.createMany({
        data: input.items.map((item) => ({
          quoteDetailId: randomUUID(),
          quoteId,
          itemCode: item.itemCode,
          itemName: item.itemName,
          salesUnit: item.salesUnit,
          unitPriceExclTax: item.unitPriceExclTax,
          unitPriceInclTax: item.unitPriceInclTax,
          taxRate: item.taxRate,
          minQty: item.minQty ?? null,
          maxQty: item.maxQty ?? null,
          remark: item.remark || null,
        })),
      });

      return updated;
    });
  }

  /**
   * 软删除报价单：仅允许删除草稿状态单据，记录审计追踪
   */
  static async deleteQuote(
    client: TenantPrismaClient,
    quoteId: string,
    auditCtx?: { userId: string },
  ) {
    const existing = await client.customerQuote.findUnique({
      where: { quoteId },
    });
    if (!existing || existing.isDeleted) {
      throw new Error(`报价单 [${quoteId}] 不存在`);
    }
    if (existing.status !== "DRAFT") {
      throw new Error(`仅“草稿”状态的报价单支持删除，已生效单据请执行作废操作`);
    }

    return client.customerQuote.update({
      where: { quoteId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedById: auditCtx?.userId ?? null,
      },
    });
  }

  /**
   * 变更报价单状态（草稿 -> 已生效 / 已作废）
   */
  static async updateQuoteStatus(
    client: TenantPrismaClient,
    quoteId: string,
    status: "ACTIVE" | "VOIDED",
  ) {
    const existing = await client.customerQuote.findUnique({
      where: { quoteId },
    });
    if (!existing || existing.isDeleted) {
      throw new Error(`报价单 [${quoteId}] 不存在`);
    }

    if (status === "ACTIVE" && existing.status !== "DRAFT") {
      throw new Error(`仅“草稿”状态的报价单允许审核生效`);
    }

    return client.customerQuote.update({
      where: { quoteId },
      data: { status },
      include: {
        items: true,
      },
    });
  }

  /**
   * 三级报价优先级匹配算法 (DEC-CUS-002: 门店报价 > 客户报价 > 区域报价)
   * 给定商品、门店、客户、区域与下单日期，精准返回有效报价明细
   */
  static async resolvePrice(
    client: TenantPrismaClient,
    params: {
      itemCode: string;
      customerCode: string;
      storeCode: string;
      regionCode: string;
      orderDate?: Date;
    },
  ) {
    const date = params.orderDate || new Date();

    // 筛选处于生效期内的有效报价单通用条件
    const activeQuoteCondition = {
      status: "ACTIVE",
      isDeleted: false,
      effectiveDate: { lte: date },
      OR: [{ expiryDate: null }, { expiryDate: { gte: date } }],
    };

    // 1. 最高优先级：精准匹配【门店报价】
    if (params.storeCode) {
      const storeQuoteItem = await client.customerQuoteItem.findFirst({
        where: {
          itemCode: params.itemCode,
          quote: {
            ...activeQuoteCondition,
            storeCode: params.storeCode,
          },
        },
        include: { quote: true },
        orderBy: { quote: { effectiveDate: "desc" } },
      });

      if (storeQuoteItem) {
        return {
          priority: "STORE" as const,
          matchedBy: `门店报价 [${params.storeCode}]`,
          item: storeQuoteItem,
        };
      }
    }

    // 2. 第二优先级：匹配【客户报价】（适用于该客户下所有门店）
    if (params.customerCode) {
      const customerQuoteItem = await client.customerQuoteItem.findFirst({
        where: {
          itemCode: params.itemCode,
          quote: {
            ...activeQuoteCondition,
            customerCode: params.customerCode,
            storeCode: null,
          },
        },
        include: { quote: true },
        orderBy: { quote: { effectiveDate: "desc" } },
      });

      if (customerQuoteItem) {
        return {
          priority: "CUSTOMER" as const,
          matchedBy: `客户报价 [${params.customerCode}]`,
          item: customerQuoteItem,
        };
      }
    }

    // 3. 第三优先级：匹配【区域报价】（保底通用价）
    if (params.regionCode) {
      const regionQuoteItem = await client.customerQuoteItem.findFirst({
        where: {
          itemCode: params.itemCode,
          quote: {
            ...activeQuoteCondition,
            regionCode: params.regionCode,
            customerCode: null,
            storeCode: null,
          },
        },
        include: { quote: true },
        orderBy: { quote: { effectiveDate: "desc" } },
      });

      if (regionQuoteItem) {
        return {
          priority: "REGION" as const,
          matchedBy: `区域报价 [${params.regionCode}]`,
          item: regionQuoteItem,
        };
      }
    }

    return null;
  }
}
