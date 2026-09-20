import assert from "node:assert/strict";
import test from "node:test";
import {
  deriveCatalogDefinitions,
  deriveNavSections,
  derivePermissionCatalog,
  derivePermissionTree,
  filterNavSections,
  derivePageList,
  derivePageCatalog,
  pruneDynamicMenuTree,
  buildMenuTree,
  deriveMenuAlignedPermissionTree,
  type TenantFeatureManifest,
  type StandardPageDescriptor,
  type TenantMenuNode,
} from "./manifest";

const mockFeatureA: TenantFeatureManifest = {
  id: "feature-a",
  name: "特性 A",
  order: 10,
  navSections: [
    {
      id: "biz",
      title: "业务中心",
      items: [
        {
          id: "item-a1",
          label: "页面 A1",
          href: "/a1",
          requiredAction: "read",
          requiredSubject: "SubjectA1",
        },
        {
          id: "group-a",
          label: "分组 A",
          items: [
            {
              id: "item-a2",
              label: "页面 A2",
              href: "/a2",
              requiredAction: "read",
              requiredSubject: "SubjectA2",
            },
          ],
        },
      ],
    },
  ],
  permissionModules: [
    {
      moduleKey: "mod-a",
      label: "模块 A",
      iconName: "User",
      pages: [
        {
          resource: "res.a1",
          subject: "SubjectA1",
          label: "页面 A1",
          actions: [
            {
              action: "read",
              label: "查看",
            },
            {
              action: "create",
              label: "新建",
            },
          ],
          configurableFields: [
            {
              field: "field1",
              label: "字段1",
            },
          ],
        },
      ],
    },
  ],
};

const mockFeatureB: TenantFeatureManifest = {
  id: "feature-b",
  name: "特性 B",
  order: 20,
  navSections: [
    {
      id: "biz",
      title: "业务中心",
      items: [
        {
          id: "item-b1",
          label: "页面 B1",
          href: "/b1",
          requiredAction: "read",
          requiredSubject: "SubjectB1",
        },
      ],
    },
  ],
  permissionModules: [
    {
      moduleKey: "mod-b",
      label: "模块 B",
      iconName: "Package",
      pages: [
        {
          resource: "res.b1",
          subject: "SubjectB1",
          label: "页面 B1",
          actions: [
            {
              action: "read",
              label: "查看",
            },
          ],
        },
      ],
    },
  ],
};

test("deriveCatalogDefinitions 能够从 permissionModules 自动派生、聚合与去重", () => {
  const defs = deriveCatalogDefinitions([mockFeatureA, mockFeatureB]);
  assert.equal(defs.length, 2);
  assert.equal(defs[0].resource, "res.a1");
  assert.deepEqual(defs[0].actions, ["read", "create"]);
  assert.equal(defs[0].actionMetadata?.read?.label, "查看");
  assert.deepEqual(defs[0].fields, ["field1"]);
  assert.equal(defs[1].resource, "res.b1");
});

test("deriveCatalogDefinitions 当切片无 permissionModules 时能安全返回空", () => {
  const emptyFeature: TenantFeatureManifest = {
    id: "empty",
    name: "空特性",
  };
  const defs = deriveCatalogDefinitions([emptyFeature]);
  assert.equal(defs.length, 0);
});

test("derivePermissionCatalog 生成强类型 PermissionCatalog 实例", () => {
  const catalog = derivePermissionCatalog([mockFeatureA, mockFeatureB]);
  assert.ok(catalog);
  assert.equal(catalog.definitions.length, 2);
  assert.equal(catalog.resolve("res.a1")?.subject, "SubjectA1");
});

test("PermissionCatalog.getDeclaredActions 按 Subject 返回契约声明的标准与自定义动作", () => {
  const catalog = derivePermissionCatalog([mockFeatureA, mockFeatureB]);
  assert.deepEqual(catalog.getDeclaredActions("SubjectA1"), ["read", "create"]);
  // 未注册 Subject Fail-Closed
  assert.deepEqual(catalog.getDeclaredActions("UnknownSubject"), []);
});

test("deriveNavSections 能够自动合并同 sectionId 的菜单与分组", () => {
  const sections = deriveNavSections([mockFeatureA, mockFeatureB]);
  assert.equal(sections.length, 1);
  assert.equal(sections[0].id, "biz");
  assert.equal(sections[0].items.length, 3); // item-a1, group-a, item-b1
});

test("derivePermissionTree 能够提取所有模块描述", () => {
  const tree = derivePermissionTree([mockFeatureA, mockFeatureB]);
  assert.equal(tree.length, 2);
  assert.equal(tree[0].moduleKey, "mod-a");
  assert.equal(tree[1].moduleKey, "mod-b");
});

test("filterNavSections 依据 can 判定过滤叶子节点与空分组", () => {
  const sections = deriveNavSections([mockFeatureA, mockFeatureB]);

  // 场景 1: 仅拥有 SubjectA1 权限
  const filtered1 = filterNavSections(
    sections,
    (action, subject) => action === "read" && subject === "SubjectA1",
  );
  assert.equal(filtered1.length, 1);
  assert.equal(filtered1[0].items.length, 1);
  assert.equal((filtered1[0].items[0] as { id: string }).id, "item-a1");

  // 场景 2: 拥有 SubjectA2 权限（所属折叠分组被保留）
  const filtered2 = filterNavSections(
    sections,
    (action, subject) => action === "read" && subject === "SubjectA2",
  );
  assert.equal(filtered2.length, 1);
  assert.equal(filtered2[0].items.length, 1);
  assert.equal((filtered2[0].items[0] as { id: string }).id, "group-a");

  // 场景 3: 没有任何权限时，整个 section 被完全移除
  const filtered3 = filterNavSections(sections, () => false);
  assert.equal(filtered3.length, 0);
});

test("derivePageList & derivePageCatalog 能够自愈提取功能清单", () => {
  const pages = derivePageList([mockFeatureA, mockFeatureB]);
  // 从 mockFeatureA (item-a1, item-a2) 与 mockFeatureB (item-b1) 自动提取
  assert.equal(pages.length, 3);
  const keys = pages.map((p) => p.pageKey);
  assert.ok(keys.includes("item-a1"));
  assert.ok(keys.includes("item-a2"));
  assert.ok(keys.includes("item-b1"));

  const catalog = derivePageCatalog([mockFeatureA, mockFeatureB]);
  assert.equal(catalog.get("item-a1")?.defaultLabel, "页面 A1");
  assert.equal(catalog.get("item-a1")?.requiredSubject, "SubjectA1");
  assert.equal(catalog.get("item-b1")?.featureName, "特性 B");
});

test("pruneDynamicMenuTree 支持跨 Feature 聚合、别名重命名与权限自动剪枝", () => {
  const catalog = derivePageCatalog([mockFeatureA, mockFeatureB]);

  // 模拟现场胡老师配置的动态菜单树：
  // 1. 独立顶层单页: item-a1 (改名为 "我的工作台")
  // 2. 跨 Feature 大菜单: "基础设置"，聚合了 item-a2 (来自 Feature A) 和 item-b1 (来自 Feature B，改名为 "跨切片B1")
  const dynamicTree: TenantMenuNode[] = [
    {
      id: "custom-workbench",
      itemType: "PAGE",
      pageKey: "item-a1",
      customLabel: "我的工作台",
      sortOrder: 1,
    },
    {
      id: "custom-group-base",
      itemType: "GROUP",
      customLabel: "基础设置",
      customIcon: "Settings",
      sortOrder: 2,
      children: [
        {
          id: "node-a2",
          parentId: "custom-group-base",
          itemType: "PAGE",
          pageKey: "item-a2",
          sortOrder: 1,
        },
        {
          id: "node-b1",
          parentId: "custom-group-base",
          itemType: "PAGE",
          pageKey: "item-b1",
          customLabel: "跨切片B1",
          sortOrder: 2,
        },
      ],
    },
  ];

  // 场景 1: 全权限用户，能看到工作台，以及基础设置分组下的两个跨切片页面
  const sectionsFull = pruneDynamicMenuTree(dynamicTree, catalog, () => true);
  assert.equal(sectionsFull.length, 1);
  assert.equal(sectionsFull[0].items.length, 2);

  // 检查项 1：顶层单页生效且改名成功
  const item1 = sectionsFull[0].items[0] as { id: string; label: string };
  assert.equal(item1.id, "custom-workbench");
  assert.equal(item1.label, "我的工作台");

  // 检查项 2：大菜单聚合成功且包含跨切片子页面，子页面别名生效
  const group = sectionsFull[0].items[1] as {
    id: string;
    label: string;
    items: { id: string; label: string; href: string }[];
  };
  assert.equal(group.label, "基础设置");
  assert.equal(group.items.length, 2);
  assert.equal(group.items[0].label, "页面 A2"); // 未配 customLabel，自动回退默认
  assert.equal(group.items[1].label, "跨切片B1"); // 配了 customLabel，别名生效

  // 场景 2: 仅有 SubjectB1 权限（无 SubjectA1, SubjectA2 权限）
  // 期望：工作台不可见，基础设置下仅有 item-b1
  const sectionsPartial = pruneDynamicMenuTree(
    dynamicTree,
    catalog,
    (action, subject) => action === "read" && subject === "SubjectB1",
  );
  assert.equal(sectionsPartial.length, 1);
  assert.equal(sectionsPartial[0].items.length, 1);
  const partialGroup = sectionsPartial[0].items[0] as unknown as {
    label: string;
    items: { label: string }[];
  };
  assert.equal(partialGroup.label, "基础设置");
  assert.equal(partialGroup.items.length, 1);
  assert.equal(partialGroup.items[0].label, "跨切片B1");

  // 场景 3: 没有任何权限时，基础设置因无可用子页面，整个大菜单自动剪枝消失
  const sectionsNone = pruneDynamicMenuTree(dynamicTree, catalog, () => false);
  assert.equal(sectionsNone.length, 0);

  // 场景 4: 外链节点透传与打开方式测试
  const dynamicTreeWithLink: TenantMenuNode[] = [
    {
      id: "ext-link-bi",
      itemType: "LINK",
      customLabel: "外部看板",
      externalUrl: "https://bi.company.com",
      openInNewTab: true,
      sortOrder: 1,
    },
    {
      id: "group-with-link",
      itemType: "GROUP",
      customLabel: "协同中心",
      sortOrder: 2,
      children: [
        {
          id: "child-link",
          parentId: "group-with-link",
          itemType: "LINK",
          customLabel: "飞书文档",
          externalUrl: "https://feishu.cn",
          openInNewTab: true,
          sortOrder: 1,
        },
      ],
    },
  ];

  const sectionsLink = pruneDynamicMenuTree(
    dynamicTreeWithLink,
    catalog,
    () => false,
  );
  assert.equal(sectionsLink.length, 1);
  assert.equal(sectionsLink[0].items.length, 2);
  const topLink = sectionsLink[0].items[0] as {
    id: string;
    label: string;
    href: string;
    target?: string;
    isExternal?: boolean;
  };
  assert.equal(topLink.label, "外部看板");
  assert.equal(topLink.href, "https://bi.company.com");
  assert.equal(topLink.target, "_blank");
  assert.equal(topLink.isExternal, true);

  const subGroupLink = sectionsLink[0].items[1] as unknown as {
    label: string;
    items: {
      label: string;
      href: string;
      target?: string;
      isExternal?: boolean;
    }[];
  };
  assert.equal(subGroupLink.label, "协同中心");
  assert.equal(subGroupLink.items[0].label, "飞书文档");
  assert.equal(subGroupLink.items[0].href, "https://feishu.cn");
  assert.equal(subGroupLink.items[0].target, "_blank");
});

test("buildMenuTree 能够将扁平数据库记录递归组装为无限多层级树状结构并稳定排序", () => {
  const flatRecords = [
    {
      id: "root-1",
      parentId: null,
      itemType: "GROUP",
      customLabel: "供应链中心",
      sortOrder: 1,
    },
    {
      id: "child-1-1",
      parentId: "root-1",
      itemType: "GROUP",
      customLabel: "基础主数据",
      sortOrder: 2,
    },
    {
      id: "child-1-2",
      parentId: "root-1",
      itemType: "PAGE",
      pageKey: "item-b1",
      customLabel: "采购订单",
      sortOrder: 1,
    },
    {
      id: "deep-1-1-1",
      parentId: "child-1-1",
      itemType: "PAGE",
      pageKey: "item-a1",
      customLabel: "物料档案",
      sortOrder: 1,
    },
  ];

  const tree = buildMenuTree(flatRecords);
  assert.equal(tree.length, 1);
  assert.equal(tree[0].id, "root-1");
  assert.equal(tree[0].children?.length, 2);

  // 验证层级内根据 sortOrder 升序排列
  assert.equal(tree[0].children![0].id, "child-1-2");
  assert.equal(tree[0].children![1].id, "child-1-1");

  // 验证第 3 级深层节点递归挂载正常
  const deepChild = tree[0].children![1].children;
  assert.equal(deepChild?.length, 1);
  assert.equal(deepChild![0].id, "deep-1-1-1");
  assert.equal(deepChild![0].customLabel, "物料档案");
});

test("deriveMenuAlignedPermissionTree 支持复合页面多实体归集并消除系统内置冗余", () => {
  const mockCompositeFeature: TenantFeatureManifest = {
    id: "composite-feature",
    name: "复合中心",
    order: 10,
    pages: [
      {
        pageKey: "composite-page",
        defaultLabel: "分类与标签",
        href: "/composite/categories-tags",
        requiredAction: "read",
        requiredSubject: "CategorySubject",
        subjects: ["CategorySubject", "TagSubject"],
      },
    ],
    permissionModules: [
      {
        moduleKey: "composite-mod",
        label: "复合中心",
        iconName: "Folder",
        pages: [
          {
            resource: "composite.category",
            subject: "CategorySubject",
            label: "客户分类",
            path: "/composite/categories-tags",
            actions: [{ action: "read", label: "查看" }],
          },
          {
            resource: "composite.tag",
            subject: "TagSubject",
            label: "客户标签",
            path: "/composite/categories-tags",
            actions: [{ action: "read", label: "查看" }],
          },
        ],
      },
    ],
  };

  const menuTree: TenantMenuNode[] = [
    {
      id: "group-composite",
      itemType: "GROUP",
      customLabel: "业务导航",
      sortOrder: 1,
      children: [
        {
          id: "node-page",
          parentId: "group-composite",
          itemType: "PAGE",
          pageKey: "composite-page",
          sortOrder: 1,
        },
      ],
    },
  ];

  const alignedTree = deriveMenuAlignedPermissionTree(
    [mockCompositeFeature],
    menuTree,
  );

  // 1. 业务导航目录下只应有 1 个分组模块，不能出现带有 (系统内置) 的多余分组
  assert.equal(alignedTree.length, 1);
  assert.equal(alignedTree[0].label, "业务导航");
  assert.equal(alignedTree[0].pages.length, 1);

  // 2. 复合页面应归集两个实体，且路由只出现一次
  const pageNode = alignedTree[0].pages[0];
  assert.equal(pageNode.path, "/composite/categories-tags");
  assert.equal(pageNode.entities?.length, 2);
  assert.equal(pageNode.entities[0].subject, "CategorySubject");
  assert.equal(pageNode.entities[1].subject, "TagSubject");
});

test("pruneDynamicMenuTree 支持多 Subject 复合页面的 OR 准入原则", () => {
  const mockCompositeFeature: TenantFeatureManifest = {
    id: "composite-feature",
    name: "复合中心",
    pages: [
      {
        pageKey: "composite-page",
        defaultLabel: "分类与标签",
        href: "/composite/categories-tags",
        requiredAction: "read",
        subjects: ["CategorySubject", "TagSubject"],
      },
    ],
  };

  const catalog = derivePageCatalog([mockCompositeFeature]);
  const tree: TenantMenuNode[] = [
    {
      id: "node-comp",
      itemType: "PAGE",
      pageKey: "composite-page",
      sortOrder: 1,
    },
  ];

  // 场景 1: 仅有 Tag 权限，没有 Category 权限 -> 菜单可见 (OR准入)
  const sectionsTagOnly = pruneDynamicMenuTree(
    tree,
    catalog,
    (action, subject) => action === "read" && subject === "TagSubject",
  );
  assert.equal(sectionsTagOnly.length, 1);
  assert.equal((sectionsTagOnly[0].items[0] as { id: string }).id, "node-comp");

  // 场景 2: 仅有 Category 权限，没有 Tag 权限 -> 菜单可见 (OR准入)
  const sectionsCatOnly = pruneDynamicMenuTree(
    tree,
    catalog,
    (action, subject) => action === "read" && subject === "CategorySubject",
  );
  assert.equal(sectionsCatOnly.length, 1);
  assert.equal((sectionsCatOnly[0].items[0] as { id: string }).id, "node-comp");

  // 场景 3: 两个权限都没有 -> 菜单被安全剪枝隐藏
  const sectionsNone = pruneDynamicMenuTree(tree, catalog, () => false);
  assert.equal(sectionsNone.length, 0);
});

test("derivePageList 能够正确保留 isSystem 与 isProtected 属性", () => {
  const mockSystemManifest: TenantFeatureManifest = {
    id: "tenant-admin",
    name: "系统管理",
    pages: [
      {
        pageKey: "settings-navigation",
        defaultLabel: "菜单导航",
        href: "/settings/navigation",
        isSystem: true,
        isProtected: true,
      },
      {
        pageKey: "org-employees",
        defaultLabel: "员工管理",
        href: "/org/employees",
        isSystem: true,
      },
    ],
  };

  const pages = derivePageList([mockSystemManifest]);
  assert.equal(pages.length, 2);
  const navPage = pages.find((p) => p.pageKey === "settings-navigation");
  assert.equal(navPage?.isSystem, true);
  assert.equal(navPage?.isProtected, true);

  const empPage = pages.find((p) => p.pageKey === "org-employees");
  assert.equal(empPage?.isSystem, true);
  assert.equal(empPage?.isProtected, false);
});

test("pruneDynamicMenuTree 正确将 SECTION 节点解析为独立 FeatureNavSection 分区标头", () => {
  const mockCatalog = new Map<string, StandardPageDescriptor>([
    [
      "customer-list",
      {
        pageKey: "customer-list",
        defaultLabel: "客户档案",
        href: "/customer/customers",
        featureId: "customer-center",
        featureName: "客户中心",
        requiredAction: "read",
        requiredSubject: "Customer",
      },
    ],
    [
      "org-employees",
      {
        pageKey: "org-employees",
        defaultLabel: "员工管理",
        href: "/organization/employees",
        featureId: "tenant-admin",
        featureName: "系统管理",
        requiredAction: "read",
        requiredSubject: "Employee",
      },
    ],
  ]);

  const tree: TenantMenuNode[] = [
    {
      id: "sec-biz",
      itemType: "SECTION",
      customLabel: "业务中心",
      sortOrder: 1,
      children: [
        {
          id: "node-customer",
          parentId: "sec-biz",
          itemType: "PAGE",
          pageKey: "customer-list",
          sortOrder: 1,
        },
      ],
    },
    {
      id: "sec-sys",
      itemType: "SECTION",
      customLabel: "系统管理",
      sortOrder: 2,
      children: [
        {
          id: "node-emp",
          parentId: "sec-sys",
          itemType: "PAGE",
          pageKey: "org-employees",
          sortOrder: 1,
        },
      ],
    },
  ];

  const sections = pruneDynamicMenuTree(tree, mockCatalog, () => true);
  assert.equal(sections.length, 2);
  assert.equal(sections[0].title, "业务中心");
  assert.equal(sections[0].items.length, 1);
  assert.equal(sections[1].title, "系统管理");
  assert.equal(sections[1].items.length, 1);
});
