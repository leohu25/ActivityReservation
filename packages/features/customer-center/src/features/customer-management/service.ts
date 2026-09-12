import type { TenantPrismaClient } from "@chenrun/db-tenant";
import type {
  CreateCustomerInput,
  ListCustomerFilter,
  UpdateCustomerInput,
} from "./types";

export interface ListCustomersResult {
  items: Awaited<ReturnType<TenantPrismaClient["customer"]["findMany"]>>;
  total: number;
  page: number;
  pageSize: number;
}

export class CustomerService {
  /**
   * 生成唯一且单调递增的客户编码: CUST-YYYYMMDD-XXXX
   */
  static async generateCustomerCode(
    client: TenantPrismaClient,
  ): Promise<string> {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const datePrefix = `CUST-${yyyy}${mm}${dd}-`;

    const latest = await client.customer.findFirst({
      where: {
        customerCode: {
          startsWith: datePrefix,
        },
      },
      orderBy: { customerCode: "desc" },
      select: { customerCode: true },
    });

    let seq = 1;
    if (latest) {
      const parts = latest.customerCode.split("-");
      const lastSeq = parseInt(parts[2] || "0", 10);
      if (!isNaN(lastSeq)) {
        seq = lastSeq + 1;
      }
    }

    return `${datePrefix}${String(seq).padStart(4, "0")}`;
  }

  /**
   * 查询客户列表（服务端分页：count + skip/take，禁止全量返回）
   */
  static async listCustomers(
    client: TenantPrismaClient,
    filter: ListCustomerFilter = {},
  ): Promise<ListCustomersResult> {
    const page = Math.max(1, filter.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, filter.pageSize ?? 20));
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (filter.categoryCode) {
      where.categoryCode = filter.categoryCode;
    }
    if (filter.status) {
      where.status = filter.status;
    }
    if (filter.keyword) {
      where.OR = [
        { customerName: { contains: filter.keyword } },
        { customerCode: { contains: filter.keyword } },
        { contactPerson: { contains: filter.keyword } },
        { contactPhone: { contains: filter.keyword } },
      ];
    }
    if (filter.tagCode) {
      where.tagAssignments = {
        some: {
          tagCode: filter.tagCode,
        },
      };
    }

    const include = {
      category: true,
      tagAssignments: {
        include: {
          tag: true,
        },
      },
      _count: {
        select: {
          stores: true,
          quotes: true,
        },
      },
    } as const;

    const [total, items] = await Promise.all([
      client.customer.count({ where }),
      client.customer.findMany({
        where,
        include,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
    ]);

    return { items, total, page, pageSize };
  }

  /**
   * 获取客户详情
   */
  static async getCustomer(client: TenantPrismaClient, customerCode: string) {
    return client.customer.findUnique({
      where: { customerCode },
      include: {
        category: true,
        tagAssignments: {
          include: {
            tag: true,
          },
        },
        stores: true,
        quotes: true,
      },
    });
  }

  /**
   * 创建客户档案
   */
  static async createCustomer(
    client: TenantPrismaClient,
    input: CreateCustomerInput,
  ) {
    const category = await client.customerCategory.findUnique({
      where: { categoryCode: input.categoryCode },
    });
    if (!category) {
      throw new Error(`分类 [${input.categoryCode}] 不存在`);
    }

    const customerCode = await CustomerService.generateCustomerCode(client);

    // 格式化标签摘要
    let customerTagsStr = "";
    if (input.tagCodes && input.tagCodes.length > 0) {
      const tags = await client.customerTag.findMany({
        where: { tagCode: { in: input.tagCodes } },
        select: { tagName: true },
      });
      customerTagsStr = tags.map((t) => t.tagName).join(",");
    }

    return client.customer.create({
      data: {
        customerCode,
        customerName: input.customerName,
        categoryCode: input.categoryCode,
        contactPerson: input.contactPerson,
        contactPhone: input.contactPhone,
        settlementMethod: input.settlementMethod,
        defaultTaxRate:
          input.defaultTaxRate === undefined ? null : input.defaultTaxRate,
        creditLimit: input.creditLimit === undefined ? null : input.creditLimit,
        customerTags: customerTagsStr || null,
        salesPerson: input.salesPerson || null,
        defaultWarehouse: input.defaultWarehouse || null,
        paymentCycle: input.paymentCycle || null,
        serviceTime: input.serviceTime || null,
        status: "ACTIVE",
        tagAssignments: input.tagCodes?.length
          ? {
              create: input.tagCodes.map((tagCode) => ({
                tag: { connect: { tagCode } },
              })),
            }
          : undefined,
      },
      include: {
        category: true,
        tagAssignments: {
          include: {
            tag: true,
          },
        },
      },
    });
  }

  /**
   * 更新客户档案
   */
  static async updateCustomer(
    client: TenantPrismaClient,
    customerCode: string,
    input: UpdateCustomerInput,
  ) {
    const existing = await client.customer.findUnique({
      where: { customerCode },
    });
    if (!existing) {
      throw new Error(`客户 [${customerCode}] 不存在`);
    }

    // 若需要更新标签
    if (input.tagCodes !== undefined) {
      await client.customerTagAssignment.deleteMany({
        where: { customerCode },
      });
      if (input.tagCodes.length > 0) {
        await client.customerTagAssignment.createMany({
          data: input.tagCodes.map((tagCode) => ({
            customerCode,
            tagCode,
          })),
        });
      }
    }

    let customerTagsStr: string | undefined;
    if (input.tagCodes !== undefined) {
      if (input.tagCodes.length > 0) {
        const tags = await client.customerTag.findMany({
          where: { tagCode: { in: input.tagCodes } },
          select: { tagName: true },
        });
        customerTagsStr = tags.map((t) => t.tagName).join(",");
      } else {
        customerTagsStr = "";
      }
    }

    return client.customer.update({
      where: { customerCode },
      data: {
        customerName: input.customerName,
        categoryCode: input.categoryCode,
        contactPerson: input.contactPerson,
        contactPhone: input.contactPhone,
        settlementMethod: input.settlementMethod,
        defaultTaxRate: input.defaultTaxRate,
        creditLimit: input.creditLimit,
        customerTags: customerTagsStr,
        salesPerson: input.salesPerson,
        defaultWarehouse: input.defaultWarehouse,
        paymentCycle: input.paymentCycle,
        serviceTime: input.serviceTime,
        status: input.status,
      },
      include: {
        category: true,
        tagAssignments: {
          include: {
            tag: true,
          },
        },
      },
    });
  }

  /**
   * 变更客户状态（核心业务红线：停用客户时下属门店同时停用）
   */
  static async updateCustomerStatus(
    client: TenantPrismaClient,
    customerCode: string,
    status: "ACTIVE" | "DISABLED",
  ) {
    return client.$transaction(async (tx) => {
      const updated = await tx.customer.update({
        where: { customerCode },
        data: { status },
      });

      // 铁律：停用客户，下属所有门店强制同时停用
      if (status === "DISABLED") {
        await tx.customerStore.updateMany({
          where: { customerCode },
          data: { status: "DISABLED" },
        });
      }

      return updated;
    });
  }

  /**
   * 删除客户（核心控制点：已有门店或单据的客户不允许删除，只能停用）
   */
  static async deleteCustomer(
    client: TenantPrismaClient,
    customerCode: string,
  ) {
    const storeCount = await client.customerStore.count({
      where: { customerCode },
    });
    if (storeCount > 0) {
      throw new Error(
        `该客户下存在 ${storeCount} 家关联门店，禁止删除，请进行“停用”操作`,
      );
    }

    const quoteCount = await client.customerQuote.count({
      where: { customerCode },
    });
    if (quoteCount > 0) {
      throw new Error(`该客户已存在关联报价单记录，禁止删除，请进行“停用”操作`);
    }

    // 清理标签关联并删除客户
    await client.customerTagAssignment.deleteMany({
      where: { customerCode },
    });

    return client.customer.delete({
      where: { customerCode },
    });
  }
}
