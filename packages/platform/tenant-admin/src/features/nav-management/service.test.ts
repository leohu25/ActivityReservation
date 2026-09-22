import test from "node:test";
import assert from "node:assert/strict";
import type { TenantPrismaClient } from "@base/db-tenant";
import type { StandardPageDescriptor } from "@base/authorization";
import { NavManagementService } from "./service";

const mockAvailablePages: readonly StandardPageDescriptor[] = [
  {
    pageKey: "customer.list",
    defaultLabel: "客户档案",
    href: "/customer/customers",
    defaultIcon: "Users",
    requiredAction: "read",
    requiredSubject: "Customer",
    featureId: "customer-center",
    featureName: "客户中心",
  },
  {
    pageKey: "customer.classification",
    defaultLabel: "分类与标签",
    href: "/customer/categories-tags",
    defaultIcon: "Tags",
    requiredAction: "read",
    requiredSubject: "CustomerCategory",
    featureId: "customer-center",
    featureName: "客户中心",
  },
  {
    pageKey: "material.unit",
    defaultLabel: "计量单位",
    href: "/materials/units",
    defaultIcon: "Scale",
    requiredAction: "read",
    requiredSubject: "MaterialUnit",
    featureId: "customer-center",
    featureName: "物料管理",
  },
];

interface MockRecord {
  id: string;
  parentId: string | null;
  itemType: string;
  pageKey: string | null;
  customLabel: string | null;
  customIcon: string | null;
  sortOrder: number;
  isVisible: boolean;
  isDeleted: boolean;
}

function createMockPrisma() {
  let records: MockRecord[] = [];

  const mockPrisma = {
    tenantMenuItem: {
      async findMany({ where }: { where?: { isDeleted?: boolean } }) {
        return records
          .filter((r) =>
            where?.isDeleted === undefined
              ? true
              : r.isDeleted === where.isDeleted,
          )
          .sort((a, b) => a.sortOrder - b.sortOrder);
      },
      async deleteMany() {
        const count = records.length;
        records = [];
        return { count };
      },
      async create({ data }: { data: Record<string, unknown> }) {
        const record: MockRecord = {
          id:
            (data.id as string) ||
            `item_${Math.random().toString(36).slice(2, 8)}`,
          parentId: (data.parentId as string) || null,
          itemType: (data.itemType as string) || "PAGE",
          pageKey: (data.pageKey as string) || null,
          customLabel: (data.customLabel as string) || null,
          customIcon: (data.customIcon as string) || null,
          sortOrder: (data.sortOrder as number) ?? 0,
          isVisible: (data.isVisible as boolean) ?? true,
          isDeleted: false,
        };
        records.push(record);
        return record;
      },
    },
    async $transaction<T>(fn: (tx: unknown) => Promise<T>): Promise<T> {
      return fn(mockPrisma);
    },
  };

  return mockPrisma as unknown as TenantPrismaClient;
}

test("NavManagementService 初始状态下返回出厂默认标识 isDefault = true", async () => {
  const prisma = createMockPrisma();
  const service = new NavManagementService(prisma);

  const res = await service.getNavigationConfig(mockAvailablePages);
  assert.equal(res.isDefault, true);
  assert.equal(res.currentTree.length, 0);
  assert.equal(res.availablePages.length, 3);
});

test("NavManagementService 能够事务性持久化跨切片分组与别名定制", async () => {
  const prisma = createMockPrisma();
  const service = new NavManagementService(prisma);

  // 模拟现场胡老师配置：
  // 1. 创建大菜单 "基础设置" (id: "group-base")
  // 2. 挂载子项 1: "customer.classification" (客户中心)，别名修改为 "客群标签"
  // 3. 挂载子项 2: "material.unit" (物料中心)，别名修改为 "单位档案"
  const saved = await service.saveMenuTree(
    {
      items: [
        {
          id: "group-base",
          parentId: null,
          itemType: "GROUP",
          customLabel: "基础设置",
          customIcon: "Settings",
          sortOrder: 1,
          isVisible: true,
        },
        {
          id: "node-tag",
          parentId: "group-base",
          itemType: "PAGE",
          pageKey: "customer.classification",
          customLabel: "客群标签",
          sortOrder: 1,
          isVisible: true,
        },
        {
          id: "node-unit",
          parentId: "group-base",
          itemType: "PAGE",
          pageKey: "material.unit",
          customLabel: "单位档案",
          sortOrder: 2,
          isVisible: true,
        },
      ],
    },
    "user_admin",
    mockAvailablePages,
  );

  assert.equal(saved.isDefault, false);
  assert.equal(saved.currentTree.length, 1);
  const root = saved.currentTree[0];
  assert.equal(root.customLabel, "基础设置");
  assert.equal(root.itemType, "GROUP");
  assert.equal(root.children?.length, 2);
  assert.equal(root.children?.[0].customLabel, "客群标签");
  assert.equal(root.children?.[0].pageKey, "customer.classification");
  assert.equal(root.children?.[1].customLabel, "单位档案");
  assert.equal(root.children?.[1].pageKey, "material.unit");
});

test("NavManagementService 一键重置清空自定义菜单并安全回退", async () => {
  const prisma = createMockPrisma();
  const service = new NavManagementService(prisma);

  // 先保存一个配置
  await service.saveMenuTree(
    {
      items: [
        {
          id: "custom-item",
          itemType: "PAGE",
          pageKey: "customer.list",
          sortOrder: 0,
        },
      ],
    },
    "user_admin",
    mockAvailablePages,
  );

  // 执行重置
  const resetRes = await service.resetToDefault(mockAvailablePages);
  assert.equal(resetRes.isDefault, true);
  assert.equal(resetRes.currentTree.length, 0);
});

test("NavManagementService 防锁死拦截：若提交的菜单树移除了核心受保护页面则抛错拒绝", async () => {
  const prisma = createMockPrisma();
  const service = new NavManagementService(prisma);

  const pagesWithProtected: readonly StandardPageDescriptor[] = [
    ...mockAvailablePages,
    {
      pageKey: "settings-navigation",
      defaultLabel: "菜单导航设置",
      href: "/settings/navigation",
      defaultIcon: "FolderTree",
      featureId: "tenant-admin",
      featureName: "系统管理",
      isSystem: true,
      isProtected: true,
    },
  ];

  // 尝试保存一个不含 "settings-navigation" 的菜单树 -> 应被拦截
  await assert.rejects(
    async () => {
      await service.saveMenuTree(
        {
          items: [
            {
              id: "node-customer",
              itemType: "PAGE",
              pageKey: "customer.list",
              sortOrder: 1,
              isVisible: true,
            },
          ],
        },
        "user_admin",
        pagesWithProtected,
      );
    },
    (err: Error) => {
      assert.match(err.message, /系统核心受保护功能【菜单导航设置】/);
      return true;
    },
  );

  // 包含受保护节点但被设为 isVisible: false -> 也应被拦截
  await assert.rejects(
    async () => {
      await service.saveMenuTree(
        {
          items: [
            {
              id: "node-nav",
              itemType: "PAGE",
              pageKey: "settings-navigation",
              sortOrder: 1,
              isVisible: false,
            },
          ],
        },
        "user_admin",
        pagesWithProtected,
      );
    },
    (err: Error) => {
      assert.match(err.message, /系统核心受保护功能【菜单导航设置】/);
      return true;
    },
  );

  // 正确包含受保护节点且可见 -> 成功保存
  const successRes = await service.saveMenuTree(
    {
      items: [
        {
          id: "node-nav",
          itemType: "PAGE",
          pageKey: "settings-navigation",
          sortOrder: 1,
          isVisible: true,
        },
      ],
    },
    "user_admin",
    pagesWithProtected,
  );
  assert.equal(successRes.isDefault, false);
  assert.equal(successRes.currentTree.length, 1);
});
