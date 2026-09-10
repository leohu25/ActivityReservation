---
name: erp-feature-permissions
description: 辰润 ERP 业务切片权限与页面契约开发全流程指南。在新增、开发或重构业务功能与页面时使用，确保严格遵循页面纯数据契约 (contracts/)、受控字段三态绑定、操作按钮受控渲染、Manifest 挂载及自动化对齐测试，杜绝权限脱节与幽灵按钮。
color: purple
emoji: 🛡️
vibe: 契约即唯一事实源，前后台权限严格对齐，零幽灵按钮，零脱节
agent_created: true
---

# 辰润 ERP 业务切片权限与页面契约开发规范 (ERP Feature Permissions)

在辰润多租户 SaaS ERP 中，所有业务切片（`packages/features/*`）的权限体系严格采用**页面纯数据契约（Page Permission Contract）作为单一事实源（SSoT）**。

> **核心红线**：
>
> 1. **严禁手写两套平行世界**：切片内**彻底废除**平铺的 `permissions.ts`，每个页面必须在 `src/contracts/<page>.contract.ts` 中自包含维护自己的实体符号、受控字段枚举与页面契约；
> 2. **契约即事实源**：契约里有的，前台有按钮可点、后台有选项可配；契约里没有的，两端物理级绝不出现（杜绝空头支票与幽灵权限）；
> 3. **受控列必带身份证**：表格列凡涉及受控主数据字段，必须显式挂载 `field: MyField.XXX`，否则 CASL 无法执行 `HIDDEN` 物理列剥离。

---

## 目录组织标准

每一个业务切片（以 `customer-center` 为标杆）的权限相关目录统一如下：

```bash
packages/features/<feature-name>/src/
├── contracts/                        # 页面纯数据契约目录 (SSoT)
│   ├── <page-a>.contract.ts          # 页面 A 专属契约 (实体符号 + 字段枚举 + 页面契约)
│   ├── <page-b>.contract.ts          # 页面 B 专属契约
│   └── index.ts                      # 统一聚合导出
├── components/                       # 前台业务页面组件
│   ├── <PageA>View.tsx               # 消费 <page-a>.contract.ts
│   └── <PageA>View.test.tsx          # 页面与契约 100% 对齐测试
└── manifest.ts                       # 切片自描述清单 (组装 contracts)
```

---

## 新页面开发标准 5 步工作流

### 第一步：编写页面纯数据契约 (`src/contracts/<page>.contract.ts`)

契约必须是**无 React DOM / 无 JSX** 的纯 TypeScript 数据对象（确保兼容 Next.js RSC 服务端序列化与编译期静态提取）：

```ts
import {
  STANDARD_DATA_SCOPES,
  StandardAction,
  type FeaturePagePermissionDescriptor,
} from "@chenrun/authorization";

// 1. 实体与资源标识 (CASL Subject & Resource)
export const OrderSubject = "PurchaseOrder";
export const OrderResource = "procurement.order";

// 2. 字段字典枚举 (消除魔法字符串)
export const OrderField = {
  ORDER_NO: "orderNo",
  SUPPLIER_NAME: "supplierName",
  COST_PRICE: "costPrice",
  STATUS: "status",
} as const;

// 3. 受控字段元数据定义
export const orderConfigurableFields = [
  { field: OrderField.ORDER_NO, label: "采购单号", isSensitive: false },
  { field: OrderField.SUPPLIER_NAME, label: "供应商名称", isSensitive: false },
  { field: OrderField.COST_PRICE, label: "采购成本 (敏感资产)", isSensitive: true },
  { field: OrderField.STATUS, label: "单据状态", isSensitive: false },
] as const;

// 4. 页面级纯数据权限契约 (SSoT)
export const orderPageContract: FeaturePagePermissionDescriptor = {
  resource: OrderResource,
  subject: OrderSubject,
  label: "采购订单管理",
  path: "/procurement/orders",
  actions: [
    {
      action: StandardAction.READ,
      label: "查看单据",
      supportedScopes: STANDARD_DATA_SCOPES,
    },
    { action: StandardAction.CREATE, label: "新建采购" },
    {
      action: StandardAction.UPDATE,
      label: "修改单据",
      supportedScopes: STANDARD_DATA_SCOPES,
    },
    { action: StandardAction.DELETE, label: "删除单据" },
    { action: StandardAction.EXPORT, label: "数据导出" },
    // 如有特定业务动作，直接追加：{ action: "audit", label: "审核单据" }
  ],
  configurableFields: orderConfigurableFields.map((f) => ({
    field: f.field,
    label: f.label,
    sensitive: f.isSensitive,
  })),
} as const;
```

---

### 第二步：聚合导出 (`src/contracts/index.ts`)

在 `src/contracts/index.ts` 中导出该页面的全部常量与契约，并在切片根目录 `src/index.ts` 中统一 re-export：

```ts
// src/contracts/index.ts
export * from "./order.contract";
```

---

### 第三步：前台业务组件消费与绑定 (`src/components/*View.tsx`)

业务页面组件必须严格引入并消费契约，确保列绑定与按钮保护闭环：

#### 1. 实体与权限解析

```tsx
import { OrderField, orderPageContract } from "../contracts";

export function OrderView({ permissions, ability: explicitAbility }: Props) {
  const ability = React.useMemo(() => {
    if (explicitAbility) return explicitAbility;
    if (!permissions) return undefined;
    return {
      can(action: string, subject?: string, field?: string) {
        if (subject && subject !== orderPageContract.subject) return false;
        if (!permissions.actions.includes(action)) return false;
        if (field && permissions.fieldPolicies?.[field] === "HIDDEN") return false;
        return true;
      },
    };
  }, [explicitAbility, permissions]);
  
  // ...
```

#### 2. 表格列绑定受控 `field`

凡在契约 `orderConfigurableFields` 里声明的字段，表格列定义必须挂载 `field` 属性：

```tsx
const columns: ColumnDef<OrderItem>[] = [
  {
    id: "orderNo",
    field: OrderField.ORDER_NO, // 👈 必须绑定契约字段！
    header: "采购单号",
    cell: (item) => <span>{item.orderNo}</span>,
  },
  {
    id: "costPrice",
    field: OrderField.COST_PRICE, // 👈 必须绑定契约字段！
    header: "采购成本",
    cell: (item) => <span>{item.costPrice}</span>,
  },
  // 纯 UI 辅助列无需 field
  {
    id: "actions",
    header: "操作",
    cell: (item) => <DataTableRowActions ... />,
  }
];
```

#### 3. 操作按钮权限守卫

- **受控业务按钮**（新建、修改、导出、审核等）：
  必须使用 `(!ability || ability.can("action", orderPageContract.subject))` 条件渲染：

  ```tsx
  {(!ability || ability.can("export", orderPageContract.subject)) && (
    <Button onClick={handleExport}>
      <Download className="size-4 mr-1" />
      <span>导出数据</span>
    </Button>
  )}
  ```

- **纯 UI 交互按钮**（刷新、折叠、筛选、重置等）：
  直接书写 JSX，**无需且严禁加入权限契约**。

#### 4. 导出逻辑过滤敏感/隐藏字段

导出 CSV 时，必须自动过滤掉当前操作员被配置为 `HIDDEN` 的字段：

```tsx
const activeExportFields = fieldKeys.filter((f) => {
  if (!ability || !f.field) return true;
  return ability.can("read", orderPageContract.subject, f.field);
});
```

---

### 第四步：在切片清单中组装 (`src/manifest.ts`)

切片的自描述清单不再编写重复的大对象，直接引用并挂载各页面契约：

```ts
import type { TenantFeatureManifest } from "@chenrun/authorization";
import { orderPageContract } from "./contracts";

export const procurementManifest: TenantFeatureManifest = {
  id: "procurement-center",
  name: "采购中心",
  order: 20,
  navSections: [...],
  permissionModules: [
    {
      moduleKey: "procurement",
      label: "采购中心",
      iconName: "PackageCheck",
      pages: [
        orderPageContract, // 👈 直接挂载页面契约
      ],
    },
  ],
};
```

---

### 第五步：编写契约对齐测试 (`src/components/*View.test.tsx`)

每一个受控页面必须编写专属的契约对齐测试，确保契约动作与页面按钮 100% 呼应：

```tsx
import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToString } from "react-dom/server";
import { OrderView } from "./OrderView";
import { orderPageContract } from "../contracts";

test("OrderView 严格执行 HIDDEN 字段策略隐藏对应列与数据", () => {
  const html = renderToString(
    <OrderView
      permissions={{
        actions: ["read"],
        fieldPolicies: { costPrice: "HIDDEN" },
      }}
    />
  );
  assert.doesNotMatch(html, /<th[^>]*>采购成本<\/th>/, "HIDDEN 列头必须被剔除");
});

test("OrderView 依据 export 权限动态控制【导出数据】按钮显隐", () => {
  const withExport = renderToString(<OrderView permissions={{ actions: ["read", "export"] }} />);
  assert.match(withExport, /导出数据/);

  const withoutExport = renderToString(<OrderView permissions={{ actions: ["read"] }} />);
  assert.doesNotMatch(withoutExport, /导出数据/);
});
```

---

## 研发防呆与禁令清单 (Anti-Patterns)

- ❌ **严禁回退到平铺的 permissions.ts**：禁止在 feature 根目录下建平铺的 `permissions.ts`，所有新页面一律建在 `src/contracts/<page>.contract.ts`；
- ❌ **严禁手写两遍权限定义**：Manifest 的 `pages` 必须直接引用契约对象，禁止在 Manifest 里手写对象字面量；
- ❌ **严禁表格列漏写 `field`**：展示主数据受控字段的列如果不写 `field`，权限引擎无法介入，角色配置中心配了 `HIDDEN` 也会泄露数据；
- ❌ **严禁未实现的动作进契约**：页面如果没有写导出/审核逻辑，契约里的 `actions` 绝不能声明对应动作。
