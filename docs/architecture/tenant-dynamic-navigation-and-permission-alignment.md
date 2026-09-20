# 架构资产：多租户动态菜单配置与 CASL 四维权限对齐架构设计

> **状态**：已落地生效 (Production Ready)  
> **适用版本**：Next.js 16 (App Router + Turbopack) + React 19 + TypeScript + Prisma ORM + CASL  
> **设计目标**：实现租户自定义导航菜单（支持任意层级、重命名、自定义图标、外链挂载）与底层 CASL 四维权限（Subject / Action / Scope / Field）的深度解耦与协同对齐。

---

## 一、 背景与业务诉求

在传统企业级 ERP 与多租户 SaaS 系统中，通常面临两大对立矛盾：

1. **租户个性化诉求**：不同行业和企业的租户对导航菜单有着强烈的定制诉求。例如：企业 A 希望把“门店报价单”放在“营销中心”下，而企业 B 希望改名为“门店合约价”并挂在“零售管理 / 门店体系”的 3 级目录下；
2. **底层安全与防越权刚性底线**：后端的权限判定（谁能查看报价、谁能修改价格、谁能导出数据）必须是绝对确定且不可被前端绕过的，绝不能因为用户在界面上重命名了菜单或者换了目录层级就导致鉴权失效或越权漏洞。

为此，我们确立了**“菜单负责展示与路由拓扑，权限负责能力裁切与数据安全”**的现代解耦架构。

---

## 二、 核心解耦模型：四层协同体系

```text
┌────────────────────────────────────────────────────────────────────────┐
│ 1. 业务切片自描述功能池 (Feature Manifest & Page Catalog)                │
│    - 每个切片导出 StandardPageDescriptor 纯数据页面契约                     │
│    - 显式声明：pageKey, defaultLabel, href, defaultIcon, requiredSubject │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ (供租户菜单自由选用挂载)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 2. 租户独立物理库存储 (Tenant Dynamic Menu Store)                        │
│    - 存储于租户 PostgreSQL 独立库的 tenant_menu_item 表                  │
│    - 统一节点模型：GROUP (目录) / PAGE (页面) / LINK (外链)              │
│    - 纯标量 parent_id 关联，支持 1 级、2 级、3 级及以上无限层级递归拓扑 │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ (服务端页面渲染时聚合)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 3. 服务端 CASL 递归安全剪枝引擎 (Server Pruning Engine)                  │
│    - apps/tenant/src/kernel/navigation.ts                               │
│    - 提取租户自定义树 -> pruneDynamicMenuTree(tree, catalog, ability.can)│
│    - 核心规则：仅认受控 Subject/Action；后代页面全无权限时，整目录自动折叠 │
│    - 输出：符合 @base/ui 工业风规范的 FeatureNavSection[]                │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ (向管理员展示)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 4. 菜单驱动的角色权限配置中心 (Menu-Aligned Permission Matrix)           │
│    - deriveMenuAlignedPermissionTree(manifests, menuTree)              │
│    - 权限界面 100% 按照当前租户生效的业务菜单目录树进行分组与缩进展现   │
│    - 【查看 (read)】权限与菜单点亮联动：取消查看连带清空写操作并隐藏菜单 │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 三、 关键契约与数据模型

### 1. 标准功能页面描述契约 (`StandardPageDescriptor`)

收敛于 `@base/authorization`，纯数据结构，完全兼容 RSC 跨端序列化：

```ts
export interface StandardPageDescriptor {
  /** 全局唯一功能键，例如 'material.unit', 'customer.store' */
  readonly pageKey: string;
  /** 默认显示中文名称（如 '门店档案'） */
  readonly defaultLabel: string;
  /** 所属推荐目录分组名称（例如 '组织架构'、'企业设置'；为空则默认归入切片名称） */
  readonly group?: string;
  /** 物理路由地址（如 '/customer/stores'） */
  readonly href: string;
  /** 默认推荐图标名称（如 'Store'） */
  readonly defaultIcon?: string;
  /** 关联的 CASL 权限主体 SSoT（如 'CustomerStore'） */
  readonly requiredSubject?: string;
  /** 关联的 CASL 权限动作（默认为 'read'） */
  readonly requiredAction?: string;
  /** 是否属于系统内置功能 */
  readonly isSystem?: boolean;
  /** 是否属于核心受保护功能（禁止删除/隐藏，防止系统配置入口锁死） */
  readonly isProtected?: boolean;
  /** 所属业务切片标识（如 'customer-center'） */
  readonly featureId: string;
  /** 所属业务切片中文名（如 '客户中心'） */
  readonly featureName: string;
  readonly order?: number;
  readonly badge?: string;
}
```

### 2. 租户自定义菜单节点模型 (`TenantMenuNode`)

```ts
export interface TenantMenuNode {
  readonly id: string;
  readonly parentId?: string | null;
  /** 统一节点类型：GROUP(目录分组) | PAGE(功能页面) | LINK(外部链接) | SECTION(分区标头) */
  readonly itemType: "GROUP" | "PAGE" | "LINK" | "SECTION";
  /** 若为 PAGE，绑定 StandardPageDescriptor.pageKey */
  readonly pageKey?: string | null;
  /** 若为 LINK，配置完整跳转 URL (如 'https://bi.company.com') */
  readonly externalUrl?: string | null;
  /** 是否在新标签页打开 (_blank) */
  readonly openInNewTab?: boolean;
  /** 租户自定义覆盖名称（为空则使用对应页面的 defaultLabel） */
  readonly customLabel?: string | null;
  /** 租户自定义图标（为空则使用对应页面的 defaultIcon） */
  readonly customIcon?: string | null;
  /** 排序权重 (升序排列) */
  readonly sortOrder: number;
  /** 是否可见 */
  readonly isVisible?: boolean;
  /** 是否属于核心受保护功能（前端禁用删除/隐藏） */
  readonly isProtected?: boolean;
  /** 子节点列表 (递归支持多层级) */
  readonly children?: readonly TenantMenuNode[];
}
```

### 3. 数据库物理存储设计 (`tenant_menu_item`)

采用 Database-per-tenant 物理隔离，去除复杂的 Prisma 自关联嵌套对象，采用纯标量 `parentId`：

```prisma
model TenantMenuItem {
  id           String    @id @default(cuid())
  parentId     String?   @map("parent_id")
  itemType     String    @default("PAGE") @map("item_type") // GROUP | PAGE | LINK
  pageKey      String?   @map("page_key")
  externalUrl  String?   @map("external_url")
  openInNewTab Boolean   @default(false) @map("open_in_new_tab")
  customLabel  String?   @map("custom_label")
  customIcon   String?   @map("custom_icon")
  sortOrder    Int       @default(0) @map("sort_order")
  isVisible    Boolean   @default(true) @map("is_visible")

  // 框架强制基础审计基线 (ADR-009)
  createdById  String    @default("system") @map("created_by_id")
  deptId       String?   @map("dept_id")
  updatedById  String?   @map("updated_by_id")
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")
  isDeleted    Boolean   @default(false) @map("is_deleted")
  deletedAt    DateTime? @map("deleted_at")
  deletedById  String?   @map("deleted_by_id")

  @@index([parentId, sortOrder])
  @@index([isDeleted])
  @@map("tenant_menu_item")
}
```

---

## 四、 核心业务流程与实现原理

### 流程 1：租户业务导航菜单配置流程 (Master-Detail)

1. **入口**：企业管理员访问 `/settings/navigation`；
2. **纯业务功能池隔离**：
   - 系统管理基座（工作台、组织架构、角色权限、企业设置等）已被物理剥离出功能池；
   - 管理员只能从纯业务功能池（客户、物料、订单、采购等）中挑选页面进行自由编排与挂载；
3. **就近创建与无限层级拓扑**：
   - 树顶栏提供 `[+ 新建菜单]` 创建顶级项；
   - 鼠标悬浮在左侧任意树节点上，直接露出 `[+]` 小按钮，实现**就近创建子菜单项**；
   - 右侧属性面板提供 Segmented Control 切换节点类型：
     - `[系统功能页]`：下拉选择业务功能，显式展示底层物理路由，支持实施别名；
     - `[外部系统链接]`：填写外部系统地址，支持选择是否新标签页打开；
     - `[目录分组]`：作为多级收纳折叠抽屉；
4. **保存与生效**：
   - 前端生成稳定的唯一 CUID，保留完整的父子链条；
   - 调用 `saveMenuTreeAction`，在租户独立库的单次事务中安全保存并即时 revalidate 页面。

### 流程 2：服务端动态侧边栏安全剪枝流程 (`getAuthorizedTenantNavSections`)

在 Next.js Server Component 渲染布局阶段执行：

1. **获取 CASL Ability**：读取当前租户上下文与当前登录用户的有效角色 permissions；
2. **加载系统固定底座**：工作台与系统管理（组织、权限、设置）作为不可被随意删除的平台底座，自动根据用户的 CASL 权限判断显示或隐藏；
3. **加载租户动态业务菜单**：
   - 调用 `@base/authorization` 的通用工具函数 `buildMenuTree(items)`，在 $O(n)$ 时间内组装出多级树；
   - 调用 `pruneDynamicMenuTree(customTree, pageCatalog, can)` 进行**深度优先递归剪枝**；
4. **剪枝核心原则 (Fail-Closed)**：
   - **叶子页面**：当且仅当当前用户拥有该页面对应受控实体的 `requiredAction` 权限（如 `read`），才被保留；
   - **目录分组**：递归检查子节点。**若目录下所有子项均无权访问，该目录整组自动物理隐藏**，绝不留下空抽屉；
   - **零静默降级**：若租户库未配置任何自定义记录，业务菜单区严格为空，绝不假定默认模板。

### 流程 3：角色与权限配置对齐流程 (`RolePermissionManager`)

1. **动态映射菜单层级**：
   - 服务端调用 `deriveMenuAlignedPermissionTree(ALL_TENANT_MANIFESTS, customMenuTree)`；
   - 将租户当前已保存的真实业务菜单目录（如“营销与客户”、“供应链管理”等）作为权限矩阵的顶级大纲；
   - 目录下的页面行后方附着物理路由（如 `/customer/customers`）；
   - 未分配到业务菜单的系统底座能力（组织、权限、设置等）统一归并在底部的【系统管理与基座】分区中；
2. **【查看 (read)】权限核心联动防线**：
   - 【查看】排在首位标重，代表该功能的基础访问资格；
   - **取消查看联动**：一旦取消勾选某个页面的【查看】权限，该页面的所有后续操作权限（新建、修改、删除、审核）自动一并清空，防止出现“看不见页面却拥有修改权限”的逻辑漏洞；
   - **勾选写操作联动**：若勾选任意写操作，系统自动补充勾选底层的【查看】权限。
3. **客观准确的统计指标**：
   - 目录行实时显示：`已授权 X/Y 个功能页面 · 共生效 Z 项操作`，彻底消灭不准确的假文案与概念混淆的“完全授权”徽标。

---

## 五、 单一事实来源 (SSoT) 与三重防反锁死容灾体系

系统已全面废止 `navSections` 树形重复声明，收敛为以 `pages` 为唯一契约的单一事实源（SSoT），并通过三重纵深防御彻底解决自锁死风险（无需在顶部栏额外堆砌多余静态链接）：

| 防线层级 | 防御机制 | 技术实现 | 兜底效果 |
| :--- | :--- | :--- | :--- |
| **第一道防线 (UI 交互)** | 核心节点禁用删除与隐藏 | `MenuTreeNodeItem` & `NodePropertyForm` | 对 `isProtected: true` 的核心项（导航设置、角色权限）隐藏删除垃圾桶，禁用隐藏开关，仅允许改名、调序 |
| **第二道防线 (API 校验)** | 服务端保存事务刚性拦截 | `NavManagementService.saveMenuTree` | 强校验断言：提交树中必须包含有效可见的核心管理入口，未包含物理拒绝持久化并抛出明确错误 |
| **第三道防线 (运行时容灾)** | 服务端剪枝引擎自动兜底注入 | `apps/tenant/src/kernel/navigation.ts` | 管理员登录时，若因历史数据缺失核心管理入口，运行时引擎自动在底部注入系统管理分区，确保入口永不消失 |

### 视觉分区标头 (`SECTION`) 机制
- 动态树支持 `itemType: "SECTION"` 作为视觉大区分割标头；
- 服务端剪枝引擎将其 1:1 映射为 `FeatureNavSection.title`，由底座 `Sidebar` 原生渲染为静态小灰字标头（`<SidebarGroupLabel>`）；
- 默认出厂推荐树自动包含【业务中心】与【系统管理】两大 `SECTION`，管理员亦可在配置端自由新增、重命名或调整分区标头。

---

## 六、 开发者与日常维护规范

1. **切片贡献页面时**：
   在业务切片的 `manifest.ts` 中声明 `pages` 数组（使用 `StandardPageDescriptor` 规范），定义明确的 `pageKey` 与 `requiredSubject`，构建期脚本将自动收录至全局功能池；
2. **新增公共菜单工具时**：
   与数据库脱耦的纯计算/转换逻辑统一收敛在 `@base/authorization` 中，严禁在业务切片或 App 层重复编写组装算法；
3. **保持原子组件规范**：
   `packages/base/ui/src/components/ui/*` 属于遵循 shadcn 官方规范的原子 Primitives，源码归项目所有，支持就地使用 CVA 扩充变体与内嵌修补；任何应用级布局逻辑收敛于 `packages/base/ui/src/components/layout/*`。具体 UI 开发遵循 `.agents/skills/shadcn/` 最佳范式。
