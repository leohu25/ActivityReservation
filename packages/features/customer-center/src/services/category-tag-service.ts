import type { CustomerPrismaClient } from "../db/client";

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
    client: CustomerPrismaClient,
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
    client: CustomerPrismaClient,
    input: {
      categoryCode: string;
      categoryName: string;
      parentCode?: string | null;
      description?: string | null;
    },
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
   * 启停分类
   */
  static async updateCategoryStatus(
    client: CustomerPrismaClient,
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
  static async listTags(client: CustomerPrismaClient, tagType?: string) {
    return client.customerTag.findMany({
      where: tagType ? { tagType } : undefined,
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * 创建标签
   */
  static async createTag(
    client: CustomerPrismaClient,
    input: {
      tagCode: string;
      tagName: string;
      tagType: string;
      description?: string | null;
    },
  ) {
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
   * 启停标签
   */
  static async updateTagStatus(
    client: CustomerPrismaClient,
    tagCode: string,
    status: "ACTIVE" | "DISABLED",
  ) {
    return client.customerTag.update({
      where: { tagCode },
      data: { status },
    });
  }
}
