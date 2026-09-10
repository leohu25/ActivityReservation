# 模块 1：页面纯数据契约 (contracts/) 与权限体系

在辰润多租户 SaaS ERP 中，所有业务切片（`packages/features/*`）的权限体系严格采用**页面纯数据契约（Page Permission Contract）作为单一事实源（SSoT）**。

---

## 核心工程红线

1. **严禁手写两套平行世界**：切片内**彻底废除**平铺的 `permissions.ts`，每个页面必须在 `src/contracts/<page>.contract.ts` 中自包含维护自己的实体符号、受控字段枚举与页面契约；
2. **契约即事实源**：契约里有的，前台有按钮可点、后台有选项可配；契约里没有的，两端物理级绝不出现（杜绝空头支票与幽灵权限）；
3. **受控列必带身份证**：表格列凡涉及受控主数据字段，必须显式挂载 `field: MyField.XXX`，否则 CASL 无法执行 `HIDDEN` 物理列剥离。

---

## 契约目录规范

```bash
packages/features/<feature-name>/src/
├── contracts/                        # 页面纯数据契约目录 (SSoT)
│   ├── <page-a>.contract.ts          # 页面 A 专属契约 (实体符号 + 字段枚举 + 页面契约)
│   ├── <page-b>.contract.ts          # 页面 B 专属契约
│   └── index.ts                      # 统一聚合导出
```

---

## 契约编写模板 (`src/contracts/<page>.contract.ts`)

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

## 前台组件消费模式 (`CustomerView.tsx`)

页面组件接收服务端下发的权限与字段策略：

```tsx
interface Props {
  initialCustomers: CustomerListItem[];
  permissions?: {
    readonly actions: readonly string[];
    readonly fieldPolicies?: Readonly<Record<string, string>>;
  };
}

export function CustomerView({ initialCustomers, permissions }: Props) {
  // 1. 构造页面级 CASL Ability
  const ability = React.useMemo(() => {
    if (!permissions) return undefined;
    return {
      can(action: string, subject?: string, field?: string) {
        if (subject && subject !== customerPageContract.subject) return false;
        if (!permissions.actions.includes(action)) return false;
        if (field && permissions.fieldPolicies?.[field] === "HIDDEN") return false;
        return true;
      },
    };
  }, [permissions]);

  // 2. 表格定义挂载受控字段 (用于 DataTable 物理列剥离)
  const columns: ColumnDef<CustomerListItem>[] = [
    {
      id: "creditLimit",
      field: CustomerField.CREDIT_LIMIT, // 👈 必须挂载契约字段！
      header: "授信额度",
      cell: (row) => formatCurrency(row.creditLimit),
    },
    // ...
  ];

  // 3. 操作按钮鉴权判定
  const canExport = !ability || ability.can(StandardAction.EXPORT, customerPageContract.subject);
  const canCreate = !ability || ability.can(StandardAction.CREATE, customerPageContract.subject);
}
```
