import type { TenantPrismaClient } from "@base/db-tenant";
import {
  buildMenuTree,
  type StandardPageDescriptor,
} from "@base/authorization";
import type { NavigationConfigData, SaveMenuTreeInput } from "./types";

/**
 * 导航菜单动态管理领域服务 (Navigation Management Service)
 * 职责：
 * 1. 查询租户物理库中的动态菜单配置与全局可用功能页池；
 * 2. 事务性重构与持久化租户自定义菜单层级、跨 Feature 挂载与别名重命名；
 * 3. 支持一键重置清空，平滑无感回退至底座出厂默认推荐树。
 */
export class NavManagementService {
  constructor(private readonly tenantPrisma: TenantPrismaClient) {}

  /**
   * 获取当前租户的导航配置数据
   */
  async getNavigationConfig(
    pageList: readonly StandardPageDescriptor[],
  ): Promise<NavigationConfigData> {
    const records = await this.tenantPrisma.tenantMenuItem.findMany({
      where: { isDeleted: false },
      orderBy: { sortOrder: "asc" },
    });

    if (records.length === 0) {
      return {
        currentTree: [],
        availablePages: pageList,
        isDefault: true,
      };
    }

    // 调用 @base/authorization 通用工具递归组装无限层级树结构
    const roots = buildMenuTree(records);

    return {
      currentTree: roots,
      availablePages: pageList,
      isDefault: false,
    };
  }

  /**
   * 事务性保存租户自定义菜单树
   */
  async saveMenuTree(
    input: SaveMenuTreeInput,
    userId: string,
    pageList: readonly StandardPageDescriptor[],
  ): Promise<NavigationConfigData> {
    await this.tenantPrisma.$transaction(async (tx) => {
      // 1. 清理原有记录
      await tx.tenantMenuItem.deleteMany({});

      // 2. 插入新记录
      if (input.items && input.items.length > 0) {
        for (const item of input.items) {
          await tx.tenantMenuItem.create({
            data: {
              id: item.id || undefined,
              parentId: item.parentId || null,
              itemType: item.itemType,
              pageKey: item.pageKey || null,
              externalUrl: item.externalUrl || null,
              openInNewTab: Boolean(item.openInNewTab),
              customLabel: item.customLabel || null,
              customIcon: item.customIcon || null,
              sortOrder: item.sortOrder ?? 0,
              isVisible: item.isVisible !== false,
              createdById: userId,
              updatedById: userId,
            },
          });
        }
      }
    });

    return this.getNavigationConfig(pageList);
  }

  /**
   * 一键重置为出厂默认设置
   */
  async resetToDefault(
    pageList: readonly StandardPageDescriptor[],
  ): Promise<NavigationConfigData> {
    await this.tenantPrisma.tenantMenuItem.deleteMany({});
    return this.getNavigationConfig(pageList);
  }
}
