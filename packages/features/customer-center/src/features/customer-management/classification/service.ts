import type { TenantPrismaClient } from "@base/db-tenant";
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
  CreateTagInput,
  UpdateTagInput,
  CustomerCategoryItem,
  CustomerTagItem,
} from "./types";

/**
 * 客户分类节点模型
 */
export interface CategoryTreeNode {
  categoryCode: string;
  categoryName: string;
  parentCode: string | null;
  description: string | null;
  status: string;
  children: CategoryTreeNode[];
}

/**
 * 客户分类与标签领域服务
 */
export class CustomerCategoryTagService {
  /**
   * 自动生成分类唯一编码: CAT_YYYYMMDD_XXXX
   */
  static async generateCategoryCode(
    client: TenantPrismaClient,
  ): Promise<string> {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const prefix = `CAT_${yyyy}${mm}${dd}_`;

    const latest = await client.customerCategory.findFirst({
      where: { categoryCode: { startsWith: prefix } },
      orderBy: { categoryCode: "desc" },
      select: { categoryCode: true },
    });

    let seq = 1;
    if (latest) {
      const parts = latest.categoryCode.split("_");
      const lastSeq = parseInt(parts[2] || "0", 10);
      if (!isNaN(lastSeq)) seq = lastSeq + 1;
    }
    return `${prefix}${String(seq).padStart(4, "0")}`;
  }

  /**
   * 自动生成标签唯一编码: TAG_YYYYMMDD_XXXX
   */
  static async generateTagCode(client: TenantPrismaClient): Promise<string> {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const prefix = `TAG_${yyyy}${mm}${dd}_`;

    const latest = await client.customerTag.findFirst({
      where: { tagCode: { startsWith: prefix } },
      orderBy: { tagCode: "desc" },
      select: { tagCode: true },
    });

    let seq = 1;
    if (latest) {
      const parts = latest.tagCode.split("_");
      const lastSeq = parseInt(parts[2] || "0", 10);
      if (!isNaN(lastSeq)) seq = lastSeq + 1;
    }
    return `${prefix}${String(seq).padStart(4, "0")}`;
  }

  /**
   * 查询分类列表（底层统一方法，供管理端查全量与下拉端查启用项共同复用）
   */
  static async listCategories(
    client: TenantPrismaClient,
    filter?: { status?: "ACTIVE" | "DISABLED" },
  ): Promise<CustomerCategoryItem[]> {
    return client.customerCategory.findMany({
      where: filter?.status ? { status: filter.status } : undefined,
      orderBy: { categoryCode: "asc" },
      select: {
        categoryCode: true,
        categoryName: true,
        parentCode: true,
        description: true,
        status: true,
      },
    });
  }

  /**
   * 获取多级分类树（管理后台专用）
   */
  static async getCategoryTree(
    client: TenantPrismaClient,
  ): Promise<CategoryTreeNode[]> {
    const list = await CustomerCategoryTagService.listCategories(client);

    const map = new Map<string, CategoryTreeNode>();
    for (const item of list) {
      map.set(item.categoryCode, {
        categoryCode: item.categoryCode,
        categoryName: item.categoryName,
        parentCode: item.parentCode ?? null,
        description: item.description ?? null,
        status: item.status ?? "ACTIVE",
        children: [],
      });
    }

    const tree: CategoryTreeNode[] = [];
    for (const item of list) {
      const node = map.get(item.categoryCode)!;
      if (item.parentCode && map.has(item.parentCode)) {
        map.get(item.parentCode)!.children.push(node);
      } else {
        tree.push(node);
      }
    }

    return tree;
  }

  /**
   * 创建分类（支持自动生成唯一编码，校验父级防环）
   */
  static async createCategory(
    client: TenantPrismaClient,
    input: CreateCategoryInput,
  ) {
    if (input.parentCode) {
      const parent = await client.customerCategory.findUnique({
        where: { categoryCode: input.parentCode },
      });
      if (!parent) {
        throw new Error(`指定的父级分类 [${input.parentCode}] 不存在`);
      }
    }

    const categoryCode =
      input.categoryCode && input.categoryCode.trim().length > 0
        ? input.categoryCode.trim()
        : await CustomerCategoryTagService.generateCategoryCode(client);

    return client.customerCategory.create({
      data: {
        categoryCode,
        categoryName: input.categoryName,
        parentCode: input.parentCode || null,
        description: input.description,
        status: "ACTIVE",
      },
    });
  }

  /**
   * 更新分类基本信息
   */
  static async updateCategory(
    client: TenantPrismaClient,
    categoryCode: string,
    input: UpdateCategoryInput,
  ) {
    const existing = await client.customerCategory.findUnique({
      where: { categoryCode },
    });
    if (!existing) {
      throw new Error(`分类 [${categoryCode}] 不存在`);
    }

    if (input.parentCode && input.parentCode === categoryCode) {
      throw new Error("上级分类不能指定为自身");
    }

    return client.customerCategory.update({
      where: { categoryCode },
      data: {
        categoryName: input.categoryName,
        parentCode: input.parentCode || null,
        description: input.description,
        status: input.status,
      },
    });
  }

  /**
   * 删除分类（已有子分类或关联客户的分类禁止删除）
   */
  static async deleteCategory(
    client: TenantPrismaClient,
    categoryCode: string,
  ) {
    const childCount = await client.customerCategory.count({
      where: { parentCode: categoryCode },
    });
    if (childCount > 0) {
      throw new Error(`该分类下尚有 ${childCount} 个子级分类，禁止删除`);
    }

    const customerCount = await client.customer.count({
      where: { categoryCode, isDeleted: false },
    });
    if (customerCount > 0) {
      throw new Error(`该分类下仍有关联的有效客户档案，禁止删除`);
    }

    return client.customerCategory.delete({
      where: { categoryCode },
    });
  }

  /**
   * 启停分类
   */
  static async updateCategoryStatus(
    client: TenantPrismaClient,
    categoryCode: string,
    status: "ACTIVE" | "DISABLED",
  ) {
    return client.customerCategory.update({
      where: { categoryCode },
      data: { status },
    });
  }

  /**
   * 查询标签列表（底层统一方法，供管理端查全量与下拉端查启用项共同复用）
   */
  static async listTags(
    client: TenantPrismaClient,
    filter?: { tagType?: string; status?: "ACTIVE" | "DISABLED" },
  ): Promise<CustomerTagItem[]> {
    return client.customerTag.findMany({
      where: {
        ...(filter?.tagType ? { tagType: filter.tagType } : {}),
        ...(filter?.status ? { status: filter.status } : {}),
      },
      orderBy: { tagCode: "asc" },
      select: {
        tagCode: true,
        tagName: true,
        tagType: true,
        description: true,
        status: true,
      },
    });
  }

  /**
   * 创建标签（支持自动生成唯一编码）
   */
  static async createTag(client: TenantPrismaClient, input: CreateTagInput) {
    const tagCode =
      input.tagCode && input.tagCode.trim().length > 0
        ? input.tagCode.trim()
        : await CustomerCategoryTagService.generateTagCode(client);

    return client.customerTag.create({
      data: {
        tagCode,
        tagName: input.tagName,
        tagType: input.tagType,
        description: input.description,
        status: "ACTIVE",
      },
    });
  }

  /**
   * 更新标签基本信息
   */
  static async updateTag(
    client: TenantPrismaClient,
    tagCode: string,
    input: UpdateTagInput,
  ) {
    const existing = await client.customerTag.findUnique({
      where: { tagCode },
    });
    if (!existing) {
      throw new Error(`标签 [${tagCode}] 不存在`);
    }

    return client.customerTag.update({
      where: { tagCode },
      data: {
        tagName: input.tagName,
        tagType: input.tagType,
        description: input.description,
        status: input.status,
      },
    });
  }

  /**
   * 删除标签（检查是否有客户在使用）
   */
  static async deleteTag(client: TenantPrismaClient, tagCode: string) {
    const assignmentCount = await client.customerTagAssignment.count({
      where: { tagCode },
    });
    if (assignmentCount > 0) {
      throw new Error(
        `该标签当前已被 ${assignmentCount} 个客户关联使用，禁止删除`,
      );
    }

    return client.customerTag.delete({
      where: { tagCode },
    });
  }

  /**
   * 启停标签
   */
  static async updateTagStatus(
    client: TenantPrismaClient,
    tagCode: string,
    status: "ACTIVE" | "DISABLED",
  ) {
    return client.customerTag.update({
      where: { tagCode },
      data: { status },
    });
  }
}
