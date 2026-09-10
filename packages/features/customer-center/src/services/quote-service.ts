import { randomUUID } from "node:crypto";
import type { TenantPrismaClient } from "@chenrun/db-tenant";

export interface CreateQuoteItemInput {
  itemCode: string;
  itemName: string;
  salesUnit: string;
  unitPriceExclTax: number;
  unitPriceInclTax: number;
  taxRate: number;
  minQty?: number | null;
  maxQty?: number | null;
  remark?: string | null;
}

export interface CreateQuoteInput {
  customerCode?: string | null;
  storeCode?: string | null;
  regionCode?: string | null;
  quoteDate: string;
  effectiveDate: string;
  expiryDate?: string | null;
  quoteType?: "STANDARD" | "CYCLE";
  displayName?: string | null;
  createdBy: string;
  items: CreateQuoteItemInput[];
}

export interface ListQuoteFilter {
  customerCode?: string;
  storeCode?: string;
  regionCode?: string;
  status?: string;
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
   * 报价单列表查询
   */
  static async listQuotes(
    client: TenantPrismaClient,
    filter: ListQuoteFilter = {},
  ) {
    const where: any = {};

    if (filter.customerCode) {
      where.customerCode = filter.customerCode;
    }
    if (filter.storeCode) {
      where.storeCode = filter.storeCode;
    }
    if (filter.regionCode) {
      where.regionCode = filter.regionCode;
    }
    if (filter.status) {
      where.status = filter.status;
    }

    return client.customerQuote.findMany({
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
    });
  }

  /**
   * 创建报价单（包含明细行）
   */
  static async createQuote(
    client: TenantPrismaClient,
    input: CreateQuoteInput,
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
    if (!existing) {
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

    // 3. 第三优先级：匹配【区域报价】（适用于该区域所有客户与门店）
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

    // 未命中任何有效报价
    return null;
  }
}
