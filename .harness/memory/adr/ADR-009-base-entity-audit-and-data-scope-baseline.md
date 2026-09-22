# ADR-009: 业务实体基础审计字段基线规范与行级数据范围约束 (Base Entity Audit & Data Scope Baseline)

## 状态

已采纳 (Accepted)

## 上下文与问题背景

在多租户制造与供应链 ERP 系统中，随着业务切片（如客户中心、采购中心、仓储中心、生产制造等）的逐步扩展，各个 Feature 会持续新建大量业务数据实体。如果缺乏统一的实体基线标准，容易引发以下严重问题：

1. **数据权限无法下推**：行级数据范围（Data Scope，如“仅本人 SELF”、“本部门 DEPT”、“部门及下级 DEPT_TREE”）依赖于实体物理表中的创建人与所属部门信息。若模型缺少字段，数据权限过滤在数据库物理层直接失效。
2. **审计追溯能力缺失**：无法获知单据的创建者、最后修改者以及删除操作者。
3. **物理误删不可逆**：业务单据直接物理 `DELETE` 会导致上下游单据（如订单、对账、报表）关联崩塌，缺乏软删除保护。
4. **人工审查易遗漏**：完全依赖人类或智能体的口头约定，随着会话重启或人员交接，新实体极易漏加字段。

## 决策内容 (Decision)

### 1. 业务实体基础审计字段基线标准 (Baseline Fields SSoT)

所有属于业务实体的 Prisma 模型，除白名单豁免模型外，**强制**必须包含以下 8 个基础字段：

```prisma
/// 创建人用户ID (数据权限 SELF 核心依据，UUIDv7；系统写入为 SYSTEM_ACTOR_ID)
createdById   String    @default("00000000-0000-7000-8000-000000000000") @map("created_by_id") @db.Uuid
/// 归属部门ID (数据权限 DEPT / DEPT_TREE 核心依据，UUIDv7 创建时快照)
deptId        String?   @map("dept_id") @db.Uuid
/// 最后更新人用户ID (UUIDv7)
updatedById   String?   @map("updated_by_id") @db.Uuid
/// 软删除标记 (默认 false)
isDeleted     Boolean   @default(false) @map("is_deleted")
/// 软删除时间
deletedAt     DateTime? @map("deleted_at")
/// 软删除操作人用户ID (UUIDv7)
deletedById   String?   @map("deleted_by_id") @db.Uuid
/// 创建时间
createdAt     DateTime  @default(now()) @map("created_at")
/// 更新时间
updatedAt     DateTime  @updatedAt @map("updated_at")
```

> **ID 类型契约 (ADR-009 补充)**：`createdById` / `deptId` / `updatedById` / `deletedById` 等审计与数据范围外键统一为 `@db.Uuid`（UUIDv7），与 `User.id`、`Department.id` 主键类型对齐。系统级写入使用保留 UUID `SYSTEM_ACTOR_ID = 00000000-0000-7000-8000-000000000000`（定义于 `@base/shared`）；权限 Fail-Closed 过滤使用永不落库的 `FAIL_CLOSED_ID = 00000000-0000-0000-0000-000000000000`。

### 2. 豁免清单规则 (Exemption Policy)

仅有以下四类表允许豁免上述审计字段，任何其他新增表一律禁止擅自豁免：

- **单据明细从表**：如 `CustomerQuoteItem`。其生命周期完全由主表级联管理（`onDelete: Cascade`），数据权限直接依托于主表。
- **多对多关联中间表**：如 `CustomerTagAssignment`。仅承载关系映射，无独立实体生命周期。
- **全租户共享只读字典/配置表**：如 `CustomerTag`、`CustomerCategory`。通过自身 `status (ACTIVE/DISABLED)` 控制启停用，不归属个人或部门。
- **组织人事基座事实源表**：如 `Department`、`Position`、`EmployeeProfile`、`CompanyProfile`。作为鉴权底层拓扑的数据源，自带专属状态与树形字段。

### 3. 双重防线强制约束 (Dual-Enforcement Mechanism)

为保证后续无论由人类还是不同会话的智能体开发，该规则都能被 100% 机械化强制执行：

1. **静态架构物理门禁 (`scripts/check-entity-baseline.mjs`)**：
   - 自动解析全仓所有 `prisma/schema.prisma` 模型；
   - 逐一比对字段名、字段类型与可空性；
   - 挂载在 `./scripts/verify.sh` 与 Git `pre-commit` 物理钩子中。任何不合规的模型在提交代码时会被**一次性硬拦截**并阻断 `git commit`。
2. **门禁单测保障 (`scripts/check-entity-baseline.test.mjs`)**：
   - 验证豁免清单准确性与字段缺失拦截效果，纳入 CI/CD 流程。

## 影响与后果 (Consequences)

- **正面收益**：
  - 新增任何业务实体时，行级数据权限（Data Scope）与软删除安全具备了开箱即用的物理层承载；
  - 杜绝带病实体流入生产环境；
  - 团队无需花费心智反复审查基础字段，交由机械门禁守护。
- **开发约束**：
  - 任何新增业务实体的 PR 或提交，必须符合上述 8 字段规范，否则门禁直接报错退出。
