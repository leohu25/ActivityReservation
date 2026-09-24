# 模块 1：页面纯数据契约 (contracts/) 与权限体系

在现代企业级多租户 SaaS 架构体系中，所有业务切片（`packages/domains/*`）的权限体系严格采用**页面纯数据契约（Page Permission Contract）作为单一事实源（SSoT）**。

---

> **列表 URL 契约（已固化）**：在 `contract.ts` 使用 `defineListSearchParams({ 扩展默认值 })`（默认 page/pageSize/keyword）；Client 用 `useListSearch`。具体业务流水线由根地图统一调度。

## 权限四维命名与 SSoT 铁律

权限契约由 **Resource + Subject + Action + Field** 四维显式绑定组成，加上功能池唯一标识 **PageKey**，禁止根据名称推测映射关系：

| 维度     | 强制命名                                                                | SSoT 规则                                                                                                                                                                  |
| -------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Resource | `<domain>.<singular_resource>`；全小写，段内 `snake_case`，默认恰好两段 | 在 `contract.ts` 导出 `XxxResource` 常量；Descriptor 与 Manifest 只引用常量。例：`domain.resource`。禁止裸 key、大小写、复数漂移。确需更深层级必须先在本规范登记。         |
| Subject  | `PascalCase`                                                            | 实体型 Subject 必须与真实 Prisma model 同名；非实体能力只能使用门禁内有界白名单，并在定义处写明 capability 例外原因。                                                      |
| Action   | 小写动词或 `snake_case` 动作                                            | CRUD/导入导出使用共享 `StandardAction`；领域动作使用 `as const` 对象，如 `DomainAction.AUDIT`。Contract、Manifest、guard、`ability.can`、`assert*Ability` 禁止魔法字符串。 |
| Field    | `camelCase`                                                             | 每个 Subject 有自己的 `XxxField = {...} as const` 字典；实体型字段必须存在于对应 Prisma model；受控列与字段策略调用点只引用字段常量。                                      |
| PageKey  | 全小写 `kebab-case`，包含至少一个中划线                                 | 切片贡献功能页面池的唯一标识，例如 `<domain>-<resource-a>`。门禁正则 `/^[a-z][a-z0-9]*(?:-[a-z0-9]+)+$/` 强制校验，杜绝驼峰或下划线混杂。                                  |

TypeScript 中使用 `as const` 常量对象和推导 union，禁止使用 TypeScript 原生 `enum`（消除 IIFE 胶水与打包冗余）：

```ts
export const SampleSubject = { MASTER: "SampleMaster" } as const;
export type SampleSubject = (typeof SampleSubject)[keyof typeof SampleSubject];
export const SampleResource = { MASTER: "domain.sample_master" } as const;
export const SampleAction = { ...StandardAction, PUBLISH: "publish" } as const;
export const SampleMasterField = { CODE: "code" } as const;
```

### 严禁函数入参类型降解（反“假强类型”防线）

在定义服务端鉴权守卫（如 `assert*Ability`）或接收 `as const` 常量对象的任何业务函数时，**严禁将入参声明为宽泛的 `string`**。
必须在各切片导出的 `contract-types.ts` 中将本领域的 Subject 与 Action 聚合成联合字面量类型（如 `DomainSubject`、`DomainAction`），并在函数入参强类型绑定：

```ts
// ❌ 严禁：宽泛的 string 导致前端/服务端调用时可随意传入拼错的垃圾字符串，击穿类型防线
export function assertDomainAbility(ability: AppAbility, action: string, subject: string) { ... }

// ✅ 正确：由 as const 派生出的精确联合类型，手写拼错在编译期即刻标红拦截
export function assertDomainAbility(
  ability: AppAbility,
  action: DomainAction,
  subject: DomainSubject,
) { ... }
```

Descriptor 必须显式绑定，不允许运行时拼接或约定俗成：

```ts
export const sampleResourcePageContract: FeaturePagePermissionDescriptor = {
  resource: SampleResource.MASTER,
  subject: SampleSubject.MASTER,
  actions: [{ action: StandardAction.READ, label: "查看" }],
  configurableFields: [{ field: SampleResourceField.CODE, label: "编码" }],
};
```

### 聚合页面与复合场景的两大标准范式 (Composite Pages & Subjects Architecture)

在实际业务开发中，经常遇到“一个页面汇聚展示多个业务模块数据”（如工作台汇总卡片、聚合报表、分类与标签多 Tab 页等）。针对此类场景，框架严格定义两大标准范式：

#### 范式一：复用「实体权限键 (Entity Subject)」（默认推荐，轻量高效）

适用于**聚合页面本质上是业务主数据的快捷入口或全权视图**（即“能看实体就能看该卡片，不能看实体就自动隐藏”）：

- **心智原则**：聚合页面自身**不定义任何新的 Subject/Resource**，直接复用各子模块原本导出的实体键（如 `EntityASubject`、`EntityBSubject`）；
- **动态菜单 OR 准入原则**：用户拥有其中任意一实体的 `READ` 权限即可看到并访问该聚合菜单，全无权限自动剪枝隐藏；在 Manifest 的 `manifest.pages` 中必须显式声明 `subjects: [EntityASubject, EntityBSubject, ...]`；
- **服务端按权优雅降级（Graceful Degradation）**：聚合页面的服务端装配函数（如 `getTenantWorkbenchData`）中，**严禁无脑并发调用所有 Query 引发 403 连带白屏**！必须按权分支调度：
  ```ts
  const [dataA, dataB] = await Promise.all([
    ability.can("read", EntityASubject) ? listAQuery() : Promise.resolve(null),
    ability.can("read", EntityBSubject) ? listBQuery() : Promise.resolve(null),
  ]);
  ```
- **前端视觉按权剪枝**：前端根据返回的 `{ canView }` 状态，有权展示卡片，无权卡片自动折叠或隐藏，网格自适应重排；
- **数据范围与字段脱敏天然继承**：各子 Query 内部原生执行 `getAccessibleWhere` 与 `pickReadableFields`，数据安全性与主模块完全对齐。

#### 范式二：隔离引入「视图权限键 (View/Capability Subject)」（深度隔离，权责解耦）

适用于**聚合页面（如工作台看板、对外统计简报）必须与底层主数据彻底隔离**（即“允许普通员工在工作台看统计摘要，但严禁其进入主模块查阅/导出完整档案主数据”）：

- **心智原则**：在聚合页面自身所属的 `contract.ts` 中，开辟专属的**视图/能力型 Subject 与 Resource**（如 `WorkbenchEntityABrief`、`WorkbenchOverview`），与底层物理实体的 CRUD 权限彻底解耦；
- **契约规范**：非实体型能力必须在系统白名单备案，声明 `as const` 并导出独立的 Descriptor：
  ```ts
  // 视图键 / 能力键定义
  export const WorkbenchSubject = {
    BRIEF_A: "WorkbenchEntityABrief",
  } as const;
  export const WorkbenchResource = {
    BRIEF_A: "workbench.entity_a_brief",
  } as const;
  ```
- **权限配置矩阵独立呈现**：在系统角色管理后台中，【主数据维护目录】与【工作台视图能力】呈现为两个完全独立的配置节点，支持精细化授权；
- **BFF 轻量聚合供给**：后端提供专用的聚合 BFF Query（仅查聚合统计或脱敏摘要），仅断言 `assertDomainAbility(ability, "read", WorkbenchSubject.BRIEF_A)`；
- **防越权物理阻断**：用户由于没有 `EntityASubject` 的实体权限，即便通过网络工具绕调主数据 Query 或 Action，也会被底层物理层直接 403 拦截，杜绝数据泄露。

#### 范式三：双正交「实体键 + 视图键」联合鉴权与非排他多点投射（复杂工作台/聚合看板标准范式）

适用于**聚合工作台不仅有自身的卡片呈现开关（视图键），同时直接消费与挂载底层多个业务实体（实体键），需要双层联合受控且不破坏原生模块完整性**：

- **双正交分工**：
  1. **实体键 (Entity Subject)**：跨路由全局唯一，由底层切片导出，负责数据级 CRUD、数据范围下推与字段脱敏；
  2. **视图键 (View Key / Action)**：页面级私有自治，由聚合页面契约导出（如 `Workbench:view_dept_stats`、`Workbench:quick_action`），负责控制交互界面对应卡片与按钮的装配显隐。
- **多实体非排他投射原则 (Non-Exclusive Projection)**：
  - 聚合页面在 `manifest.pages` 中通过 `subjects: [PageSubject, EntityASubject, EntityBSubject]` 声明消费的实体；
  - 权限派生引擎（`deriveMenuAlignedPermissionTree`）将这些实体投射展示在聚合页面下供直接授权，**严禁排他独占，原生业务模块中的管理页面 100% 完整保留**；
  - 两端对同一实体的勾选状态双向同步（指向底层同一个全局 Subject 授权记录）。
- **前端联合熔断 (`CompositeGuard`)**：
  - 前端卡片受控于 `ViewAction` **AND** `EntitySubject:read`；
  - 任意一项未开启，卡片安全降级展示无权提示，注明受限根因，杜绝越权与白屏。
- **100% 强类型无魔法值**：
  - 跨切片挂载实体键时，必须显式在 `package.json` 声明 `workspace:*` 依赖，并通过导出的 `XxxSubject` 常量符号导入，严禁裸手写字符串。

---

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
export const ResourceSubject = "Resource";
export const ResourceResource = "domain.resource";

// 2. 字段字典枚举 (消除魔法字符串)
export const ResourceField = {
  CODE: "code",
  NAME: "name",
  RATE: "rate",
  AMOUNT: "amount",
  STATUS: "status",
} as const;

// 3. 受控字段元数据定义
export const resourceConfigurableFields = [
  { field: ResourceField.CODE, label: "资源编码", isSensitive: false },
  { field: ResourceField.NAME, label: "资源名称", isSensitive: false },
  {
    field: ResourceField.RATE,
    label: "关键比率",
    isSensitive: true,
  },
  {
    field: ResourceField.AMOUNT,
    label: "受控金额",
    isSensitive: true,
  },
  { field: ResourceField.STATUS, label: "业务状态", isSensitive: false },
] as const;

// 4. 页面级纯数据权限契约 (SSoT)
// 核心架构规范与边界划分（透明直观，拒绝黑盒）：
// 1. 数据范围（行级数据权限）100% 专职服务于“列表查询与数据加载（READ）”，通过 getAccessibleWhere 下推数据库 SQL 过滤；
// 2. 操作权限（CREATE/UPDATE/DELETE/EXPORT/PUBLISH 等）纯粹由“角色”控制（二元开关：角色有该动作即允许操作，无则拦截），不叠加复杂隐式行数据范围，保证界面配置所见即所得；
// 3. 契约规范：只有 StandardAction.READ 声明 supportedScopes，其余操作禁止声明 supportedScopes。
export const resourcePageContract: FeaturePagePermissionDescriptor = {
  resource: ResourceResource,
  subject: ResourceSubject,
  label: "资源管理",
  path: "/<domain>/<resources>",
  actions: [
    {
      action: StandardAction.READ,
      label: "查看记录",
      supportedScopes: STANDARD_DATA_SCOPES, // 仅列表读取声明行数据范围
    },
    { action: StandardAction.CREATE, label: "新建记录" },
    { action: StandardAction.UPDATE, label: "修改记录" },
    { action: StandardAction.DELETE, label: "删除记录" },
    { action: StandardAction.EXPORT, label: "数据导出" },
  ],
  configurableFields: resourceConfigurableFields.map((f) => ({
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
// packages/domains/<domain>/src/features/<resource>/ui/<Resource>View.tsx
"use client";
import { useAbility } from "@base/authorization";
import { DataTable, useListSearch } from "@base/ui";
import {
  resourceSearchParams,
  resourcePageContract,
  ResourceField,
} from "../contract";

interface Props {
  data: ResourceListItem[];
  total: number;
  // 禁止：permissions / ability props；禁止 initial* 镜像 state
}

export function ResourceView({ data, total }: Props) {
  const ability = useAbility();
  const list = useListSearch(resourceSearchParams);

  const columns: ColumnDef<ResourceListItem>[] = [
    {
      id: "code",
      field: ResourceField.CODE, // 👈 必须挂载契约字段！
      header: "编码",
      cell: (row) => row.code,
    },
  ];

  return (
    <DataTable
      {...list.dataTableProps}
      data={data}
      columns={columns}
      total={total}
      rowKey={(c) => c.id}
      subject={resourcePageContract.subject} // 只传 subject
      title="资源档案列表"
    />
  );
}
```

完整注入链路与 layout 样板由根地图索引对应的 CASL 规范调度。

### 自定义扩展动作

标准 CRUD/导出由共享 `StandardAction` 提供；页面特有操作由领域 `as const` 动作对象声明，并由契约、按钮与 Server Action 共同引用：

```ts
export const ResourceAction = {
  ...StandardAction,
  TOGGLE_STATUS: "toggle_status",
} as const;

actions: [
  { action: ResourceAction.TOGGLE_STATUS, label: "启用/停用" },
]

{ label: "停用", action: ResourceAction.TOGGLE_STATUS, onClick: ... }
assertSliceAbility(
  ability,
  ResourceAction.TOGGLE_STATUS,
  ResourceSubject,
);
```

两页都要「盘点」但权限互不通用 → 各自契约、**不同 Subject**；动作值可同名，但必须由所属领域动作对象引用。

---

## 模块 1.1：Prisma 原生关系过滤与安全搜索范式

在复杂业务单据（如出入库流水、主子表明细单）中，数据库底层往往存储关联实体外键（如 `targetId`），而业务用户在界面输入框搜索的是**关联对象的业务名称**（如“示例名称”）。

为遵循 Prisma 官方最佳实践并消除私有 DSL 历史包袱，框架推行 **Prisma 官方原生嵌套关系过滤（范式 A）**：

1. **Schema 声明关系**：
   在切片 Schema 中声明对关联实体的 `@relation`。

2. **后端查询服务 (`service.ts`)**：
   直接使用 Prisma 官方强类型嵌套过滤：

   ```ts
   if (params.keyword) {
     const q = sanitizeSearchKeyword(params.keyword);
     where.OR = [
       { docNo: { contains: q, mode: "insensitive" } },
       { operatorName: { contains: q, mode: "insensitive" } },
       { targetEntity: { name: { contains: q, mode: "insensitive" } } },
     ];
   }
   ```

3. **前端输入框 (`@base/ui`)**：
   使用清晰直观的 `keywordPlaceholder` 属性声明提示文案：

   ```tsx
   <DataTable
     {...list.dataTableProps}
     keywordPlaceholder="搜索单号、经办人、名称..."
   />
   ```

4. **门禁静态强拦截 (`scripts/check/check-redlines.mjs`)**：
   严禁在单据 Service 中对外键编码直接使用 `contains` 文本检索；必须通过关联模型字段或参数化查询进行关联过滤。
