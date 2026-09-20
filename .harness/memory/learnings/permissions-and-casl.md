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
