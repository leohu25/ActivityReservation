# 特性背景：通用实体审计基础字段规范与客户中心数据权限闭环 (arch-data-scope-and-base-entity-audit)

## 一、 业务目标与需求背景

### 1. 痛点问题根因

在租户权限管理中，管理员可以为角色配置行级数据范围（Data Scope，如“仅本人 `SELF`”、“本部门 `DEPT`”、“部门及下级 `DEPT_TREE`”、“全租户 `ALL`”）。然而在客户中心（`customer-center`）当前实现中，普通用户被配置为“仅本人”后，登录仍能看到全量客户档案数据。

经代码排查，根本原因存在以下三点：

1. **实体物理缺少归属与审计字段**：`Customer` 等业务实体的 Prisma Schema 缺少 `createdById`（创建人 ID）、`deptId`（归属部门 ID）以及软删除字段（`isDeleted` / `deletedAt`），导致数据库层面没有任何用于判断数据归属人的物理列。
2. **装配层缺失员工组织拓扑编译**：`getTenantCustomerContext` 仅调用了 `createForTenant` 编译纯 RBAC 功能权限，没有通过 `resolveEmployeeTopology` 解析当前操作人的部门架构树并调用 `createPrismaAbilityForTenant` 注入数据范围条件。
3. **查询链路未做 Accessible Where 下推**：`CustomerService.listCustomers` 仅对读取出的结果做字段级隐藏（`pickReadableFields`），未将 `getAccessibleWhere` 生成的 SQL 条件合并进 Prisma 的 `where` 子句进行物理拦截。
4. **缺乏全局实体基础字段基线与门禁检查**：缺乏自动化脚本检查所有业务实体是否强制包含必填的基础字段（如创建人、部门、软删除），导致新增实体时易遗漏。

### 2. 核心目标

1. **统一业务实体基线规范门禁**：
   - 编写自动化架构门禁脚本（如 `scripts/check-entity-baseline.mjs`），强制检查所有业务实体（除特定字典/关联表外）必须包含基础字段：
     - 创建人：`createdById String @map("created_by_id")`
     - 部门归属：`deptId String? @map("dept_id")`
     - 更新人：`updatedById String? @map("updated_by_id")`
     - 软删除标记：`isDeleted Boolean @default(false) @map("is_deleted")`
     - 软删除时间：`deletedAt DateTime? @map("deleted_at")`
     - 时间戳：`createdAt DateTime @default(now()) @map("created_at")`, `updatedAt DateTime @updatedAt @map("updated_at")`
2. **客户中心实体与数据权限闭环**：
   - 扩展 `Customer` 等核心实体 Schema 字段及数据库迁移；
   - 新建客户时自动填入当前登录用户的 `createdById` 与所在 `deptId`；
   - 在 `getTenantCustomerContext` 中编译带拓扑的 `PrismaAbility`；
   - 在 `CustomerService.listCustomers` 中下推 `getAccessibleWhere(ability, "Customer", "read")` 与软删除过滤 `isDeleted: false`。

---

## 二、 核心功能用例

1. **UC-01: 实体基础字段合规性静态门禁**
   - 门禁脚本扫描 `packages/db-tenant/prisma/` 与各 Feature 下的 prisma schema，确保所有业务模型包含审计字段与软删除字段，CI / `verify.sh` 自动拦截不合规模型。
2. **UC-02: 客户创建时自动注入审计与部门上下文**
   - 用户在客户端调用 `createCustomerAction`，服务端从 `TenantCustomerContext` 中提取 `userId` 和当前成员所属 `departmentId`，写入新建记录。
3. **UC-03: 客户列表按 Data Scope 动态过滤**
   - 管理员配置“仅本人”：用户仅可查询 `createdById = 当前用户ID` 的客户；
   - 管理员配置“本部门”：用户可查询 `deptId = 当前部门ID` 的客户；
   - 管理员配置“部门及下级”：用户可查询 `deptId in (当前部门及所有子孙部门ID列表)` 的客户；
   - 软删除数据默认被全局过滤。

---

## 三、 设计边界与依赖

- **依赖包**：
  - `@base/authorization`：提供 `resolveEmployeeTopology`, `getAccessibleWhere`, `resolveDataScopeConditions`
  - `@base/db-tenant`：提供 `TenantPrismaClient` 与 `resolveEmployeeTopology` 依赖的部门拓扑查询
  - `@base/feature-customer-center`：核心落地受控切片
- **不变量**：
  - 必须保持软删除安全（默认过滤 `isDeleted: false`）；
  - 严禁绕过租户隔离；
  - 严禁破坏现有 RBAC 与字段级权限。
