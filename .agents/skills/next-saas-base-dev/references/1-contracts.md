# 模块 1：页面纯数据契约 (contracts/) 与权限体系

在现代企业级多租户 SaaS 架构体系中，所有业务切片（`packages/domains/*`）的权限体系严格采用**页面纯数据契约（Page Permission Contract）作为单一事实源（SSoT）**。

---

> **列表 URL 契约（已固化）**：在 `contract.ts` 使用 `defineListSearchParams({ 扩展默认值 })`（默认 page/pageSize/keyword）；Client 用 `useListSearch`。细节见 `9-crud-resource-paradigm.md`。

## 权限四维命名与 SSoT 铁律

权限契约由 **Resource + Subject + Action + Field** 四维显式绑定组成，加上功能池唯一标识 **PageKey**，禁止根据名称推测映射关系：

| 维度     | 强制命名                                                                | SSoT 规则                                                                                                                                                                                 |
| -------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Resource | `<domain>.<singular_resource>`；全小写，段内 `snake_case`，默认恰好两段 | 在 `contract.ts` 导出 `XxxResource` 常量；Descriptor 与 Manifest 只引用常量。例：`material.item_master`、`customer.store`。禁止裸 key、大小写、复数漂移。确需更深层级必须先在本规范登记。 |
| Subject  | `PascalCase`                                                            | 实体型 Subject 必须与真实 Prisma model 同名；非实体能力只能使用门禁内有界白名单，并在定义处写明 capability 例外原因。                                                                     |
| Action   | 小写动词或 `snake_case` 动作                                            | CRUD/导入导出使用共享 `StandardAction`；领域动作使用 `as const` 对象，如 `QuoteAction.AUDIT`。Contract、Manifest、guard、`ability.can`、`assert*Ability` 禁止魔法字符串。                 |
| Field    | `camelCase`                                                             | 每个 Subject 有自己的 `XxxField = {...} as const` 字典；实体型字段必须存在于对应 Prisma model；受控列与字段策略调用点只引用字段常量。                                                     |
| PageKey  | 全小写 `kebab-case`，包含至少一个中划线                                 | 切片贡献功能页面池的唯一标识，例如 `customer-stores`、`material-categories`。门禁正则 `/^[a-z][a-z0-9]*(?:-[a-z0-9]+)+$/` 强制校验，杜绝驼峰或下划线混杂。                                |

TypeScript 中使用 `as const` 常量对象和推导 union，禁止使用 TypeScript 原生 `enum`（消除 IIFE 胶水与打包冗余）：

```ts
export const ItemSubject = { MASTER: "ItemMaster" } as const;
export type ItemSubject = (typeof ItemSubject)[keyof typeof ItemSubject];
export const ItemResource = { MASTER: "material.item_master" } as const;
export const ItemAction = { ...StandardAction, PUBLISH: "publish" } as const;
export const ItemMasterField = { ITEM_CODE: "itemCode" } as const;
```

### 严禁函数入参类型降解（反“假强类型”防线）

在定义服务端鉴权守卫（如 `assert*Ability`）或接收 `as const` 常量对象的任何业务函数时，**严禁将入参声明为宽泛的 `string`**。
必须在各切片导出的 `contract-types.ts` 中将本领域的 Subject 与 Action 聚合成联合字面量类型（如 `MaterialSubject`、`MaterialAction`），并在函数入参强类型绑定：

```ts
// ❌ 严禁：宽泛的 string 导致前端/服务端调用时可随意传入拼错的垃圾字符串，击穿类型防线
export function assertMaterialAbility(ability: AppAbility, action: string, subject: string) { ... }

// ✅ 正确：由 as const 派生出的精确联合类型，手写拼错在编译期即刻标红拦截
export function assertMaterialAbility(
  ability: AppAbility,
  action: MaterialAction,
  subject: MaterialSubject,
) { ... }
```

Descriptor 必须显式绑定，不允许运行时拼接或约定俗成：

```ts
export const itemMasterPageContract: FeaturePagePermissionDescriptor = {
  resource: ItemResource.MASTER,
  subject: ItemSubject.MASTER,
  actions: [{ action: StandardAction.READ, label: "查看" }],
  configurableFields: [{ field: ItemMasterField.ITEM_CODE, label: "商品编码" }],
};
```

### 聚合页面与独立实体 (Composite Pages & Multiple Subjects)

“同一页面/同一 Tab 组”不代表共享 Subject。只要是独立实体且未来可能独立授权（例如 `ItemCategory`、`ItemVariety`、`ItemGrade`，或 `CustomerCategory`、`CustomerTag`）：

1. **分别声明独立契约**：必须分别声明各自的 Subject、Resource、Field 和 Descriptor；
2. **Manifest 消费全部契约**：切片 Manifest 的 `permissionModules.pages` 必须全量消费所有 Descriptor；
3. **复合功能页面必须声明 `subjects` 数组**：在 `manifest.pages` 功能池中，当页面聚合了多个实体时，必须显式声明 `subjects: [SubjectA, SubjectB, ...]`。门禁 `scripts/check/check-permission-contracts.mjs` 对此执行物理级静态强拦截；
4. **动态菜单遵循 OR 准入原则**：用户拥有其中任意一实体的 `READ` 权限即可看到并访问该菜单，全无权限自动剪枝隐藏；
5. **角色权限中心行内嵌套展开**：权限管理树按页面容器聚合，并在行内树状展开各子实体，独立配置操作按钮、数据范围与字段；
6. **服务端按权优雅降级**：页面可以组合查询，但每个 Query/Action 必须校验自己实体对应的 Subject，禁止无条件并发引发 403 白屏崩溃。只有生命周期不可分割、无独立授权语义的值对象/级联明细才允许受聚合根权限代理，并需在契约注释中说明。

### 硬门禁

```bash
node scripts/check/check-permission-contracts.mjs
```

该门禁在 `pnpm verify`（`scripts/verify.mjs`）中硬阻断，检查命名格式、Prisma Subject/Field 对齐、Resource 唯一性、Descriptor 常量引用、Manifest Descriptor 消费，以及 `assert*Ability`/`ability.can`/guard 的 Action 与 Subject 魔法字符串。静态检查无法证明任意动态路由到 Query 的完整调用图，因此代码评审仍需确认页面调用的所有 Query Descriptor 已在 Manifest 注册。

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
packages/domains/<business-area>/src/features/
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
} from "@base/authorization";

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
  {
    field: CustomerField.DEFAULT_TAX_RATE,
    label: "默认税率(%)",
    isSensitive: true,
  },
  {
    field: CustomerField.CREDIT_LIMIT,
    label: "信用额度(元)",
    isSensitive: true,
  },
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
// packages/domains/customer-center/.../ui/CustomerView.tsx
"use client";
import { useAbility } from "@base/authorization";
import { DataTable, useListSearch } from "@base/ui";
import { customerSearchParams, customerPageContract } from "../contract";

interface Props {
  data: CustomerListItem[];
  total: number;
  // 禁止：permissions / ability props；禁止 initial* 镜像 state
}

export function CustomerView({ data, total }: Props) {
  const ability = useAbility();
  const list = useListSearch(customerSearchParams);

  const columns: ColumnDef<CustomerListItem>[] = [
    {
      id: "creditLimit",
      field: CustomerField.CREDIT_LIMIT, // 👈 必须挂载契约字段！
      header: "授信额度",
      cell: (row) => formatCurrency(row.creditLimit),
    },
  ];

  return (
    <DataTable
      {...list.dataTableProps}
      data={data}
      columns={columns}
      total={total}
      rowKey={(c) => c.id || c.customerCode}
      subject={customerPageContract.subject} // 只传 subject
      title="客户档案"
    />
  );
}
```

完整注入链路与 layout 样板见 **`references/7-casl-ability-provider.md`**。

### 自定义扩展动作

标准 CRUD/导出由共享 `StandardAction` 提供；页面特有操作由领域 `as const` 动作对象声明，并由契约、按钮与 Server Action 共同引用：

```ts
export const CustomerAction = {
  ...StandardAction,
  TOGGLE_STATUS: "toggle_status",
} as const;

actions: [
  { action: CustomerAction.TOGGLE_STATUS, label: "启用/停用客户" },
]

{ label: "停用客户", action: CustomerAction.TOGGLE_STATUS, onClick: ... }
assertCustomerAbility(
  ability,
  CustomerAction.TOGGLE_STATUS,
  CustomerSubject,
);
```

两页都要「盘点」但权限互不通用 → 各自契约、**不同 Subject**；动作值可同名，但必须由所属领域动作对象引用。

---

## 模块 1.1：Prisma 原生关系过滤与安全搜索范式

在复杂业务单据（如销售订单、采购单、出入库流水）中，数据库底层往往存储外键编码（如 `customerCode` / `storeCode`），而业务用户在界面输入框搜索的是**关联对象的名称**（如客户名称“李四”、门店名称“总店”）。

为遵循 Prisma 官方最佳实践并消除私有 DSL 历史包袱，框架推行 **Prisma 官方原生嵌套关系过滤（范式 A）**：

1. **Schema 声明关系**：
   在切片 Schema 中声明对关联实体的 `@relation`。

2. **后端查询服务 (`service.ts`)**：
   直接使用 Prisma 官方强类型嵌套过滤：

   ```ts
   if (params.keyword) {
     const q = sanitizeSearchKeyword(params.keyword);
     where.OR = [
       { orderId: { contains: q, mode: "insensitive" } },
       { salesPerson: { contains: q, mode: "insensitive" } },
       { customer: { customerName: { contains: q, mode: "insensitive" } } },
       { store: { storeName: { contains: q, mode: "insensitive" } } },
     ];
   }
   ```

3. **前端输入框 (`@base/ui`)**：
   使用清晰直观的 `keywordPlaceholder` 属性声明提示文案：

   ```tsx
   <DataTable
     {...list.dataTableProps}
     keywordPlaceholder="搜索订单号、销售员、客户、门店..."
   />
   ```

4. **门禁静态强拦截 (`scripts/check/check-redlines.mjs`)**：
   严禁在单据 Service 中对外键编码直接使用 `contains` 文本检索；必须通过关联模型字段或参数化查询进行关联过滤。
