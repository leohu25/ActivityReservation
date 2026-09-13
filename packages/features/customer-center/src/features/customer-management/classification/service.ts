import type { TenantPrismaClient } from "@base/db-tenant";
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
  CreateTagInput,
  UpdateTagInput,
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
   * 获取多级分类树
   */
  static async getCategoryTree(
    client: TenantPrismaClient,
  ): Promise<CategoryTreeNode[]> {
    const list = await client.customerCategory.findMany({
      orderBy: { categoryCode: "asc" },
    });

    const map = new Map<string, CategoryTreeNode>();
    for (const item of list) {
      map.set(item.categoryCode, {
        categoryCode: item.categoryCode,
        categoryName: item.categoryName,
        parentCode: item.parentCode,
        description: item.description,
        status: item.status,
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
   * 创建分类（校验父级防环）
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

    return client.customerCategory.create({
      data: {
        categoryCode: input.categoryCode,
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
   * 获取所有标签（可按类型过滤）
   */
  static async listTags(client: TenantPrismaClient, tagType?: string) {
    return client.customerTag.findMany({
      where: tagType ? { tagType } : undefined,
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * 创建标签
   */
  static async createTag(client: TenantPrismaClient, input: CreateTagInput) {
    return client.customerTag.create({
      data: {
        tagCode: input.tagCode,
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
