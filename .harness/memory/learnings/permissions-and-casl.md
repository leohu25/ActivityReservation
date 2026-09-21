# 权限与 CASL 领域避坑指南 (Permissions & CASL Learnings)

本模块记录在 CASL 四层权限闭环、页面纯数据契约 (SSoT)、数据范围下推、字段三态策略与工作台多实体建模中的避坑经验。

---

## 1. 权限定义与强类型声明 (Better Auth + CASL)

- **痛点**：在引入成熟权限库后，开发者/AI 仍可能随手使用未经验证的裸字符串（如直接手写 `"procurement.order.create"` 或拼写错误），导致权限判定失效或意外越权。
- **解法与规范**：
  - 功能权限统一在各切片的 `contract.ts` 中声明，禁止魔法字符串；
  - 严禁手写魔术字符串，统一引用切片导出的权限强类型对象与常量（如 `XxxSubject`、`XxxResource`、`XxxAction`、`XxxField`）；
  - 服务端使用 `assert*Ability(ability, action, subject)` 或 CASL `ability.can()` 判定；前端列表由 `DataTable` 自动接管，独立按钮通过 `<AuthGuard>` 门禁；字段策略通过 `<AuthorizedField>` 或 `FormModal` 三态控制。

---

## 2. 页面级纯数据契约 (SSoT Contract) 与权限前后台对齐

- **痛点**：传统开发容易手写两套平行世界：`manifest.ts` 声明一套权限，前台业务组件（`*View.tsx`）又手写一套列定义与按钮；导致严重脱节：后台配置树上勾选了“导出”，前台根本没写按钮（幽灵权限）；或后台设为 `HIDDEN`，前台因漏挂 `field` 泄露数据。
- **解法与铁律**：
  1. **页面契约单一事实源 (SSoT)**：各业务页面在 `src/features/<feature>/contract.ts` 中自包含维护自己的实体名（Subject）、资源名（Resource）、字段枚举（Field）、受控元数据与页面契约对象（`FeaturePagePermissionDescriptor`）；
  2. **双端无损消费**：
     - **切片清单 (`manifest.ts`)**：只负责组装各页面的契约对象，严禁手写重复的大对象字面量；
     - **业务组件 (`*View.tsx`)**：表格列必须挂载契约声明的 `field: MyField.XXX`，受控按钮受控于 CASL；
  3. **自动化对齐门禁**：每个页面配套编写测试，断言契约动作与页面按钮 100% 呼应，断言 `HIDDEN` 字段物理级剥离。

---

## 3. 严禁接收端函数将 as const 精确类型降解为 string (反“假强类型”防线)

- **痛点**：在契约端构造了 `as const` 精确字面量，但在最终的鉴权函数入参却写成 `action: string, subject: string`；调用者拼错单词时编译器完全失声，导致隐蔽的运行期 `ForbiddenError`。
- **解法与铁律**：
  1. **各切片聚合领域联合类型 (`contract-types.ts`)**：集中导出由各契约推导出的精准 Subject 与 Action 联合类型（如 `CustomerSubject`、`CustomerAction`）；
  2. **守卫函数入参强制绑定**：鉴权守卫函数入参严禁写 `string`，必须直接使用领域联合类型；
  3. **静态门禁机械化兜底**：`scripts/check/check-permission-contracts.mjs` AST 静态扫描，一旦检测到任何守卫函数入参降解为 `string`，提交门禁直接报错阻断。

---

## 4. 外键字典与下拉选项解耦规范 (BFF Contextual Options Pattern 防级联瘫痪)

- **痛点**：在角色管理中取消勾选某个角色的“客户分类”维护权限，该角色访问“客户档案”列表页面直接报 `Runtime ForbiddenError: Cannot execute "read" on "CustomerCategory"` 崩溃；根因是客户列表为了渲染下拉框直接调用了后台专用的分类树查询，子字典后台维护权限反向击穿了宿主业务可用性。
- **解法与铁律**：
  1. **后台管理 Query vs 下拉选项专用 BFF Query 彻底物理分离**：
     - `listCategoriesQuery`：后台管理专属，强校验主权限；
     - `getCustomerCategoryOptionsQuery`：下拉选项专属，与主权限解耦，仅过滤有效数据并脱敏；
  2. **React 19 cache 请求级去重**：下拉查询使用 `cache(...)` 包装，单次请求内任意组件多处调用仅查库一次；
  3. **RSC 纯数据契约**：服务端查询结果必须通过 `toPlainData` 序列化，严禁向客户端传递 Promise props。

---

## 5. 表单模态框 (FormModal) 权限三态闭环、必填死锁自愈与写防篡改铁律

- **痛点**：
  1. **必填与隐藏死锁矛盾**：字段在 Zod 中必填，但管理员配置了 `HIDDEN`；前端用户看不到输入框，提交时 Zod 拦截，表单永远无法提交且看不到报错；
  2. **UI 隐藏伪安全**：前端隐藏了输入框，但后端 Server Action 未校验字段白名单，攻击者伪造 RPC 仍能非法篡改；
  3. **列表复合列绑定错位**：两字段合并单列渲染，只绑了一个字段权限，导致隐藏字段泄露。
- **工业级正统解法与全栈防御铁律**：
  1. **FormModal 自动三态治理**：自动消费全局 Ability，业务侧只需声明 `subject={XxxSubject}`；`HIDDEN` 彻底剥离不入 DOM，`READONLY` 自动禁用并提示；
  2. **动态可见性与必填协同原则 (“不显示即可不填，显示且必填才必须填”)**：FormModal 校验时动态提取可见字段，自动豁免被 `HIDDEN` 字段的必填校验，解决死锁；
  3. **后端写路径强防篡改硬门禁 (`assertEditableFields`)**：Action 执行前强制校验 Payload 字段白名单，一旦包含不可编辑或隐藏字段，立即抛出 CASL `ForbiddenError` 阻断事务。

---

## 6. 复合工作台/聚合看板的双正交权限建模与非排他实体投射铁律 (Dual-Orthogonal Standard)

- **痛点**：
  1. **工作台单维死锁**：粗粒度定义为单一 `read`，无法控制各个独立卡片的细粒度显隐；
  2. **跨路由引用引发“偷家”失踪 Bug**：工作台消费了 `CustomerTag` 实体，权限派生引擎误将其标记为独占认领，导致原生【客户中心】里的管理页面直接被扣除消失；
  3. **基于字符串包含的魔数判定**：通过 `label.includes("管理")` 判定系统内置，导致纯业务切片【客户中心】被强行打上 `(系统内置)` 的错误后缀；
  4. **跨切片裸写魔法字符串**：手写 `"CustomerTag"` 裸字符串，重构易断裂。
- **工业级正统解法与行为铁律**：
  1. **实体键与视图键双正交解耦 (Dual-Orthogonal Standard)**：
     - **实体键 (Entity Subject)**：跨路由全局唯一，负责底层数据的 CRUD、数据范围下推与字段脱敏；
     - **视图键 (View Key / Workbench Action)**：页面级私有自治，在工作台契约中声明细粒度动作（如 `view_dept_stats`、`view_tags`、`quick_action`），负责控制交互界面卡片的显隐；
  2. **多实体非排他投射原则 (Non-Exclusive Composite Projections)**：
     - 聚合页面在 `manifest.pages` 中通过 `subjects: [PageSubject, EntityASubject, ...]` 声明消费的实体；
     - `createPermissionNode` 仅将主实体或原生路由与当前页面完全一致的实体标记为排他认领；对于跨路由辅助引用的实体，仅作工作台下的**视图投射**，**严禁从原生业务模块中剔除**；
     - 两端对同一实体的配置双向同步，维护全局同一份授权状态；
  3. **前端联合熔断 (`CompositeGuard`)**：
     - 工作台卡片受控于 `ViewAction` **AND** `EntitySubject:read`；任意一项未开放，卡片展示灰色锁头与原因说明，整页绝不白屏崩溃；
  4. **彻底消灭魔法字符串 (Zero Magic Strings)**：
     - 跨切片引用业务实体时，必须显式在 `package.json` 声明 `workspace:*`，并通过切片公开契约直接导入导出的 `XxxSubject` 常量符号。

---

## 7. 路由组与 Layout 级 CASL 权限注入防线 (Fail-Closed 默认全拒绝与列消失避坑)

- **痛点（经典故障现场）**：
  - 新增了一个业务页面或管理功能（如 `/settings/dict` 数据字典），页面编写完整且单测全通；但在浏览器打开后，**表格列全部消失、右上角显示「列设置 1/1」、新增/编辑/停用/删除按钮完全不显示**；
  - **根本原因**：本项目遵循 **Fail-Closed（故障闭锁 / 默认全拒绝）** 安全哲学。`DataTable` 写按钮受控于 `ability.can("create", subject)`，表格列渲染受控于字段级脱敏 `ability.can("read", subject, col.field)`。如果所属路由组的 `layout.tsx`（如 `settings/layout.tsx` 或业务路由的 `layout.tsx`）漏掉了新实体的权限加载，客户端收到的 Ability 快照中该 `Subject` 为空，导致所有绑定了 `field` 的业务列被物理剥离，写操作按钮全部隐藏。
- **解法与铁律**：
  1. **路由组 Layout 必须一次性补齐所有子路由涉及的 Subject**：
     - 在 App Router 架构中，父级 `layout.tsx` 作为权限注入网关，必须通过 `getTenantSubjectPermissions(Subject)` 统一加载该目录下所有子页面的权限纯数据快照，并灌入 AbilityBoundary（如 `<TenantAdminAbilityBoundary>` 或业务专属 Boundary）；
     - 示例（`settings/layout.tsx`）：
       ```tsx
       const [companyProfile, roleManagement, tenantMenuItem, tenantDictItem] =
         await Promise.all([
           getTenantSubjectPermissions("CompanyProfile"),
           getTenantSubjectPermissions("RoleManagement"),
           getTenantSubjectPermissions("TenantMenuItem"),
           getTenantSubjectPermissions("TenantDictItem"), // 必须显式补齐！
         ]);
       ```
  2. **新页面挂载核对清单 (Checklist for New Sub-Routes)**：
     - [ ] 1. 契约中定义好 `Subject`、`actions` 与 `configurableFields`；
     - [ ] 2. 检查所属目录的 `layout.tsx`，**必须在 `getTenantSubjectPermissions` 中登记该 `Subject`**；
     - [ ] 3. 运行 `node scripts/sync/sync-features.mjs` 确保注册表包含新清单；
     - [ ] 4. 编写组件单测时，不仅断言有完整权限时正常显示，还要断言仅有 `read` 权限时写操作被隐藏，形成双向断言防御。

---

## 8. View 层只声明 Subject 与全链路消灭 Subject 魔法字符串 (Zero Magic String Subjects Redline)

- **痛点**：
  - 在 View 层或 Layout/Page 中随手手写裸字符串字面量（如 `subject="Customer"`、`getTenantSubjectPermissions("Role")`、`getTenantMultiSubjectPermissions(["Department", "CustomerTag"])`）；
  - 一旦发生实体名重构、多切片重名或手抖拼错，编译器失声，运行时由于查不到该魔法字符串的权限快照，直接静默将页面列和按钮隐藏，排查耗费数小时。
- **解法与铁律**：
  1. **View 层规范（2.4 节核心心智）**：
     - View 层严格通过 `subject={XxxSubject}` 纯受控声明，**必须直接引用切片契约导出的强类型常量符号**，严禁传裸字符串；
     - `DataTable` 自动接管写按钮与列脱敏；
  2. **全局统一派生与内核强类型收敛 (GlobalTenantSubject)**：
     - 通过 `scripts/sync-features.mjs` 自动从所有切片 Manifests 中提取所有页面受控实体的全局联合类型 `GlobalTenantSubject`（0 人工维护开销）；
     - `getTenantSubjectPermissions` 与 `getTenantMultiSubjectPermissions` 函数入参强制约束为 `GlobalTenantSubject`，从 TypeScript 静态类型层彻底封死逃逸路径；
  3. **自动化门禁双重拦截 (`scripts/check/check-permission-contracts.mjs`)**：
     - 门禁脚本扫描 `apps/tenant/src/**` 全量源码，一旦发现 `getTenantSubjectPermissions("...")` 或 `getTenantMultiSubjectPermissions(["..."])` 中存在裸字符串字面量，**提交门禁直接报错硬阻断**，强制提示开发者 `import { XxxSubject }` 替换！

---

## 9. 权限元数据声明 (`manifest.permissionModules`) 与运行时目录 (`catalog.ts`) 的职责与派生关系

- **痛点 / 困惑**：
  - 开发者在切片根目录下看到 `manifest.ts` 里定义了 `permissionModules: [...]`，而旁边又有一个 `catalog.ts` 执行 `derivePermissionCatalog([manifest])`，容易产生困惑：“这两者不都是权限吗？是否存在重复定义或职责混淆？”
- **两者的本质区别与 SSoT 派生关系**：
  1. **`manifest.ts` 中的 `permissionModules`（静态元数据 / UI 蓝图）**：
     - **角色**：纯粹的声明式纯数据结构（Plain Data / Object）；
     - **消费场景**：主要服务于**前端管理端 UI 渲染与平台编排**。例如：系统管理里的「角色权限分配树（Role Permission Tree）」需要按模块分组展示（`moduleKey`、`label`、`iconName`、`order`、`pages`）；应用初始化时平台扫描 Manifests 聚合全系统权限拓扑；
     - **内容**：直接引用各 Feature 的 `contract.ts` 导出的 `*PagePermissionDescriptor`，严禁在 `permissionModules` 中手写字面量。
  2. **`catalog.ts` 中的 `derivePermissionCatalog`（运行时权限目录 / CASL 引擎输入）**：
     - **角色**：可执行的 `PermissionCatalog` 实例与 TypeScript 强类型源；
     - **消费场景**：服务于**服务端 CASL 鉴权与类型推导**。在 `assembly/context.ts` 中传入 `new CaslAbilityFactory(repository, catalog)`，负责把数据库中配置的角色规则实例化为能够执行 `ability.can()`、`accessibleFieldsBy()` 以及数据过滤下推的运行时 Ability 实例；同时导出 `type XxxCatalog = typeof xxxCatalog` 提供类型提示；
     - **派生机制**：通过纯函数 `derivePermissionCatalog([manifest])` 从 Manifest 的 `permissionModules` 遍历各页面的 `actions`、`configurableFields`、`supportedScopes` 自动解析编译而来，**保证全局只有一份源头契约（SSoT），不存在重复定义**。

```text
┌────────────────────────────────────────────────────────────────────────┐
│ 1. 静态声明层 (manifest.ts)                                             │
│    permissionModules: [{ moduleKey, label, icon, pages: [PageContract] }] │
│    └─► 作用：供角色管理树等 UI 消费展示模块/页面/操作                        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ 
                                    ▼ derivePermissionCatalog([manifest])
┌────────────────────────────────────────────────────────────────────────┐
│ 2. 运行时与类型层 (catalog.ts)                                           │
│    export const xxxCatalog = derivePermissionCatalog([xxxManifest]);   │
│    export type XxxCatalog = typeof xxxCatalog;                         │
│    └─► 作用：编译为 CASL 引擎所需的 PermissionCatalog 实例，注入        │
│        CaslAbilityFactory 生成能运行 can/cannot 判定并下推过滤的 Ability │
└────────────────────────────────────────────────────────────────────────┘
```


