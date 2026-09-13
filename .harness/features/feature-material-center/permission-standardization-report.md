# 权限四维契约标准化与硬门禁改造报告

## 一、 背景与根因

在引入物料与工艺中心特性时，页面端与服务端鉴权出现两类典型阻断：

1. `ForbiddenError: Cannot execute "read" on "ItemVariety"`：页面契约与角色权限树按粗粒度聚合下发 `ItemCategory`，而 Query/Service 端使用独立实体名 `ItemVariety` 进行强校验，导致授权链断裂。
2. 权限命名漂移与魔法字符串：历史各切片中 Resource 命名存在裸字符串（如 `customer_store`、`customer_quote`）、复数漂移（如 `system.roles`、`audit.logins`）、大小写与下划线不规范，且多处调用端手写权限字符串，缺乏集中式 SSoT 约束。

根据明确指令，本项目执行**全仓立即阻断**策略：

- 全面落实 Resource、Subject、Action、Field 四维强类型契约与 `as const` 单一事实源；
- 独立主数据（如 `ItemCategory`、`ItemVariety`、`ItemGrade`、`CustomerCategory`、`CustomerTag`）全面恢复为独立 Subject/Resource，禁止非级联实体的主题代理；
- 一次性替换存量 Resource Key，编写平台级数据库数据迁移，彻底清理旧 Key 并自增权限版本使 CASL 缓存即时刷新；
- 编写硬门禁脚本 `scripts/check-permission-contracts.mjs` 并挂载至 `./scripts/verify.sh`；
- 更新项目权威架构规范 `next-saas-base-dev`。

---

## 二、 权限四维命名与 SSoT 规范

| 维度 | 规范格式 | 强制标准与校验要求 | 正确示例 | 违规反例 |
| :--- | :--- | :--- | :--- | :--- |
| **Resource** | `<domain>.<singular_resource>` | 全小写、段内下划线 `snake_case`、单数名词、两段层级；全仓全局唯一；Descriptor 必须引用契约常量。 | `material.item_master`<br>`customer.store`<br>`system.role_management` | `customer_store` (无点号)<br>`system.roles` (复数)<br>`material.Item` (大写) |
| **Subject** | `PascalCase` | 实体型 Subject 必须与 Prisma Model 名 100% 严格一致；非实体能力必须属于有界白名单；Descriptor 必须引用常量。 | `ItemMaster`<br>`PurchaseOrder`<br>`RoleManagement` (白名单能力) | `item_master`<br>`itemMaster` |
| **Action** | `lowercase` / `snake_case` | 平台通用 CRUD 必须引用 `@base/authorization` 的 `StandardAction`；领域扩展动作由切片 `as const` 动作字典导出；严禁裸传字符串。 | `StandardAction.READ`<br>`ProcurementAction.AUDIT` | `"read"`<br>`"AUDIT"` |
| **Field** | `camelCase` | 每个受控 Subject 在契约中导出 `as const` 字段字典；字典值必须对齐对应 Prisma Model 实际声明字段；受控列与策略拦截只引用字典属性。 | `ItemMasterField.REFERENCE_PRICE`<br>`ProcurementOrderField.COST_PRICE` | `"referencePrice"`<br>`"cost_price"` |

---

## 三、 旧 Resource Key → 新 Resource Key 映射表

| 业务切片 | 旧 Resource Key | 新规范 Resource Key | 对应 Subject (Prisma / 能力) | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| `customer-center` | `customer` | `customer.customer` | `Customer` | 统一两段命名空间 |
| `customer-center` | `customer_store` | `customer.store` | `CustomerStore` | 消除无点号单段命名 |
| `customer-center` | `customer_quote` | `customer.quote` | `CustomerQuote` | 消除无点号单段命名 |
| `customer-center` | `customer_category_tag` | `customer.category`<br>`customer.tag` | `CustomerCategory`<br>`CustomerTag` | 拆分为两个独立受控实体，各自拥有独立契约 |
| `tenant-admin` | `system.roles` | `system.role_management` | `RoleManagement` | 消除复数命名漂移，对齐管理能力 |
| `tenant-admin` | `audit.operations` | `audit.operation` | `AuditLogOperation` | 统一为单数名词 |
| `tenant-admin` | `audit.logins` | `audit.login` | `AuditLogLogin` | 统一为单数名词 |
| `tenant-admin` | `audit.permissions` | `audit.permission` | `AuditLogPermission` | 统一为单数名词 |
| `material-center` | `material.category` | `material.item_category`<br>`material.item_variety`<br>`material.item_grade` | `ItemCategory`<br>`ItemVariety`<br>`ItemGrade` | 彻底拆分独立主数据实体，各自拥有独立页面契约与权限项 |

---

## 四、 平台数据库数据迁移 (12-Factor Data Migration)

为支持旧 Key 的一次性替换，新增平台级数据库数据迁移：

- **迁移路径**：`tooling/db-migrate/migrations/platform/20260913150000_standardize_permission_resource_keys/`
- **迁移核心行为**：
  1. 遍历 `organization_role` 表中所有角色的 `permission` JSON；
  2. 针对基础格式与包含 `statement` / `dataScopes` / `fieldPolicies` 的四层结构，全面将旧 Resource Key 重命名为新 Resource Key；
  3. 将历史 `customer_category_tag` 角色授权原子分裂并复制到 `customer.category` 与 `customer.tag`；
  4. 将历史 `material.category` 角色授权原子分裂并复制到 `material.item_category`、`material.item_variety` 与 `material.item_grade`；
  5. 修复 `EmployeeProfile`、`Department`、`Position`、`CustomerQuote` 的历史受控字段映射（如 `orderNum` $\to$ `sort`，`leaderId` $\to$ `leaderMemberId` 等）；
  6. **自增租户权限版本**：`UPDATE organization SET authorization_version = authorization_version + 1;`，使所有租户节点的 CASL 权限缓存立即失效重算。
- **静态预编译**：同步刷新 `tooling/db-migrate/generated/runtime-catalog.ts`，并通过 `pnpm --filter @base/db-migrate check` 校验。

---

## 五、 物理门禁与静态检查能力

新增自动化静态检查脚本 `scripts/check-permission-contracts.mjs`，并作为第 5 道关卡挂载至 `./scripts/verify.sh`：

1. **命名正则与形态校验**：
   - Resource: `^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$`（全小写、两段点号、snake_case、单数）；
   - Subject: `^[A-Z][A-Za-z0-9]*$`（PascalCase）；
   - Action: `^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$`（小写/下划线动词）；
   - Field: `^[a-z][A-Za-z0-9]*$`（camelCase）。
2. **Prisma 模型双向对齐**：
   - 提取所有切片 Prisma 文件中的实体与字段；
   - 检查所有实体型 Subject 必须存在于真实 Prisma 模型中；
   - 检查契约字段字典（`XxxField`）中声明的每一个字段必须真实存在于目标 Prisma 模型中。
3. **全局唯一性与独立声明校验**：
   - 全仓 Resource Key 必须全局唯一，禁止不同契约重复声明同一 Resource；
   - 禁止隐式 Subject 别名（如 `ItemVarietySubject = ItemCategorySubject`），除非显式标记 `@deprecated`。
4. **契约闭环校验**：
   - 契约中声明的 Subject 必须被至少一个 `FeaturePagePermissionDescriptor` 显式绑定并导出；
   - Descriptor 内的 `resource`、`subject`、`action` 必须引用常量，禁止手写字面量；
   - `manifest.ts` 中引用的页面契约必须完整注册至 `permissionModules.pages`；
   - `manifest.ts` 中的 `requiredAction` 必须引用 `StandardAction` 常量。
5. **调用端魔法字符串拦截**：
   - 扫描业务代码中 `assert*Ability`、`ability.can`、UI 按钮 `action` prop；
   - 强制只允许传递已声明的 `XxxSubject`、`StandardAction.X` 或 `DomainAction.X` 以及 `XxxField.X` 常量。

---

## 六、 规范事实源更新

更新开发规范事实源：

- `.agents/skills/next-saas-base-dev/SKILL.md`：在核心工程红线第一条明确四维权限契约铁律；
- `.agents/skills/next-saas-base-dev/references/1-contracts.md`：增补《权限四维命名与 SSoT 铁律》、《聚合页面与独立实体》、《硬门禁》标准章节与代码示例。

---

## 七、 验证证据矩阵

| 验证项 | 执行命令 | 结果 |
| :--- | :--- | :--- |
| 权限四维门禁检查 | `node scripts/check-permission-contracts.mjs` | `✓ Permission contracts satisfy Resource/Subject/Action/Field SSoT rules` |
| 授权基座单元测试 | `pnpm --filter @base/authorization test` | `ok 43/43` 通过 |
| 客户中心单元测试 | `pnpm --filter @base/feature-customer-center test` | `ok 34/34` 通过 |
| 租户管理单元测试 | `pnpm --filter @base/feature-tenant-admin test` | `ok 19/19` 通过 |
| 物料中心单元测试 | `pnpm --filter @base/feature-material-center test` | `ok 8/8` 通过 |
| 迁移工具预编译与校验 | `pnpm --filter @base/db-migrate check` | `Migration artifacts are consistent` |
| 租户端生产构建 | `pnpm --filter tenant build` | 23/23 页面构建成功通过（Turbopack） |
| 全栈物理门禁 | `./scripts/verify.sh` | 全部 8 大关卡 100% 满分通过 |

---

## 八、 残余风险与说明

1. **静态分析边界**：静态门禁能够确保契约定义、Manifest 声明、Prisma 对齐以及各守卫调用点完全消除魔法字符串；但无法替代跨动态路由的端到端调用链推导，新增页面时需继续遵循开发规范将页面消费的所有 Query 所属 Descriptor 显式登记至对应 Manifest。
2. **生产环境旧数据迁移**：针对线上或多租户测试库，在部署本版本代码时，需随发布流程执行平台迁移 `20260913150000_standardize_permission_resource_keys`，使已存库的角色授权数据平滑升级为新 Key。
