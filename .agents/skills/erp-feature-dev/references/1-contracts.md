# 模块 1：页面纯数据契约 (contracts/) 与权限体系

在辰润多租户 SaaS ERP 中，所有业务切片（`packages/features/*`）的权限体系严格采用**页面纯数据契约（Page Permission Contract）作为单一事实源（SSoT）**。

---

## 核心工程红线

1. **严禁手写两套平行世界**：切片内**彻底废除**平铺的 `permissions.ts`，每个页面必须在 Feature/Sub-Feature 的 `contract.ts` 中自包含维护自己的实体符号、受控字段枚举与页面契约；
2. **契约即事实源**：契约里有的，前台有按钮可点、后台有选项可配；契约里没有的，两端物理级绝不出现（杜绝空头支票与幽灵权限）；
3. **受控列必带身份证**：表格列凡涉及受控主数据字段，必须显式挂载 `field: MyField.XXX`，否则 CASL 无法执行 `HIDDEN` 物理列剥离；
4. **标准动作预制 + 自定义扩展**：`read/create/update/delete/export` 按页面勾选；页面特有操作（如 `toggle_status`）在契约 `actions` 中声明独立标识；运行时动作清单由 Catalog `getDeclaredActions(subject)` 派生，禁止第二份硬编码白名单；
5. **页面 hide 同步契约**：`hideView/hideEdit/hideDelete` 或页面不渲染的按钮，必须从契约 `actions` 移除，角色目录随之变短。

---

## 契约目录规范

在遵循 **Feature-based Vertical Slice Architecture** 的业务切片中，契约同级就近放置在各自 Feature / Sub-Feature 目录下，消灭顶层大平铺：

```bash
packages/features/<business-area>/src/features/
├── <feature-a>/
│   ├── contract.ts                   # 核心特性 A 专属契约 (实体符号 + 字段枚举 + 页面契约)
│   └── <sub-feature>/
│       └── contract.ts               # 子特性专属契约
└── <feature-b>/
    └── contract.ts                   # 核心特性 B 专属契约
```

---

## 契约编写模板 (Feature/Sub-Feature 的 `contract.ts`)

契约必须是**无 React DOM / 无 JSX** 的纯 TypeScript 数据对象（确保兼容 Next.js RSC 服务端序列化与编译期静态提取）：

```ts
import {
  STANDARD_DATA_SCOPES,
  StandardAction,
  type FeaturePagePermissionDescriptor,
} from "@chenrun/authorization";

// 1. 实体与资源标识 (CASL Subject & Resource)
export const CustomerSubject = "Customer";
export const CustomerResource = "customer.customer";

// 2. 字段字典枚举 (消除魔法字符串)
export const CustomerField = {
  CUSTOMER_CODE: "customerCode",
  CUSTOMER_NAME: "customerName",
  DEFAULT_TAX_RATE: "defaultTaxRate",
  CREDIT_LIMIT: "creditLimit",
  STATUS: "status",
} as const;

// 3. 受控字段元数据定义
export const customerConfigurableFields = [
  { field: CustomerField.CUSTOMER_CODE, label: "客户编码", isSensitive: false },
  { field: CustomerField.CUSTOMER_NAME, label: "客户名称", isSensitive: false },
  { field: CustomerField.DEFAULT_TAX_RATE, label: "默认税率(%)", isSensitive: true },
  { field: CustomerField.CREDIT_LIMIT, label: "信用额度(元)", isSensitive: true },
  { field: CustomerField.STATUS, label: "客户状态", isSensitive: false },
] as const;

// 4. 页面级纯数据权限契约 (SSoT)
export const customerPageContract: FeaturePagePermissionDescriptor = {
  resource: CustomerResource,
  subject: CustomerSubject,
  label: "客户档案管理",
  path: "/customer/customers",
  actions: [
    {
      action: StandardAction.READ,
      label: "查看客户",
      supportedScopes: STANDARD_DATA_SCOPES,
    },
    { action: StandardAction.CREATE, label: "新建客户" },
    {
      action: StandardAction.UPDATE,
      label: "修改客户",
      supportedScopes: STANDARD_DATA_SCOPES,
    },
    { action: StandardAction.DELETE, label: "删除客户" },
    { action: StandardAction.EXPORT, label: "数据导出" },
  ],
  configurableFields: customerConfigurableFields.map((f) => ({
    field: f.field,
    label: f.label,
    sensitive: f.isSensitive,
  })),
} as const;
```

---

## 前台组件消费模式（官方 AbilityProvider，禁止旧双轨）

权限快照在 **切片 layout** 注入，View **只收业务数据**，不再接收 `permissions`/`ability` props。

```tsx
// packages/features/customer-center/src/features/customer-management/ui/CustomerView.tsx
"use client";
import { useAbility } from "@chenrun/authorization";
import { DataTable } from "@chenrun/ui";

interface Props {
  initialCustomers: CustomerListItem[];
  // 禁止：permissions?: {...} / ability?: {...}
}

export function CustomerView({ initialCustomers }: Props) {
  // 命令式 can()（如导出字段过滤）用官方 useAbility；按钮显隐交给 ActionButton
  const ability = useAbility();

  const columns: ColumnDef<CustomerListItem>[] = [
    {
      id: "creditLimit",
      field: CustomerField.CREDIT_LIMIT, // 👈 必须挂载契约字段！
      header: "授信额度",
      cell: (row) => formatCurrency(row.creditLimit),
    },
  ];

  return (
    <DataTable.Workspace
      data={initialCustomers}
      columns={columns}
      rowKey={(c) => c.customerCode}
      subject={customerPageContract.subject} // 只传 subject
      title="客户档案"
    />
  );
}
```

完整注入链路与 layout 样板见 **`references/7-casl-ability-provider.md`**（标杆：`customer/layout.tsx` + `CustomerAbilityBoundary`）。

### 自定义扩展动作

标准 CRUD/导出由契约勾选；页面特有操作在契约 `actions` 中声明独立标识，
并与按钮 `action`、Server Action `assertAbility` 使用同一名称：

```ts
// contracts/customer.contract.ts
actions: [
  ...,
  { action: "toggle_status", label: "启用/停用客户" },
]

// View extraActions
{ label: "停用客户", action: "toggle_status", onClick: ... }

// Server Action
assertCustomerAbility(ability, "toggle_status", CustomerSubject);
```

两页都要「盘点」但权限互不通用 → 各自契约、**不同 Subject**，同名 action 也不共用。
