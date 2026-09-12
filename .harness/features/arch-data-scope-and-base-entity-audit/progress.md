# 特性任务看板：通用实体审计基础字段规范与客户中心数据权限闭环 (arch-data-scope-and-base-entity-audit)

## 一、 阶段任务分解

- [x] **阶段一：实体基础审计与软删除字段规范制定与静态门禁**
  - [x] 制定通用实体基线字段列表与豁免清单规则
  - [x] 编写门禁脚本 `scripts/check-entity-baseline.mjs` 与单测 `scripts/check-entity-baseline.test.mjs`
  - [x] 集成至 `scripts/verify.sh` 与门禁流水线
- [x] **阶段二：数据库模式演进与迁移**
  - [x] 扩展 `packages/features/customer-center/prisma/schema.prisma`（补齐 `createdById`, `deptId`, `updatedById`, `isDeleted`, `deletedAt`, `deletedById`）
  - [x] 扩展 `packages/features/procurement-center/prisma/schema.prisma`（补齐审计基线）
  - [x] 运行 `sync-tenant-schema.mjs` 生成 Canonical Schema 并通过 `tooling/db-migrate` 建立数据库基线
- [x] **阶段三：客户中心装配层与数据范围能力接入**
  - [x] 改造 `packages/features/customer-center/src/assembly/context.ts`：引入 `resolveEmployeeTopology` 并调用 `createPrismaAbilityForTenant`
  - [x] 保证无租户/异常状态下的 Fail-Closed 防护
- [x] **阶段四：服务层与写路径（Server Action / Service）改造**
  - [x] `createCustomerAction` / `createStoreAction`：自动注入当前登录人员的 `createdById` 与 `deptId`
  - [x] `CustomerService.listCustomers`：基于 `getAccessibleWhere(ability, "Customer", "read")` 下推物理查询条件，并追加 `isDeleted: false` 显式过滤
  - [x] 适配更新与软删除逻辑（`deleteCustomerAction` 标记软删除而非物理删除，记录 `deletedById` 与 `deletedAt`）
- [x] **阶段五：专属单元测试与安全攻防验证**
  - [x] 编写数据权限攻防测试（跨人/跨部门数据隔离性单测 `data-scope.integration.test.ts`）
  - [x] 验证软删除记录不可见性与级联保护
  - [x] 全量类型检查与 `./scripts/verify.sh` 门禁自检全部 100% 通过

## 二、 实际验证记录

- `node scripts/check-entity-baseline.mjs`：扫描全部业务实体，审计基线与豁免逻辑校验通过。
- `pnpm --filter @chenrun/feature-customer-center test`：20 个测试用例全部通过（含 4 组行级数据范围端到端攻防测试）。
- `pnpm check`：14 个包全量 TypeScript 严格类型检查通过。
- `./scripts/verify.sh`：沙盒边界、红线扫描、实体基线、业务切片、门禁单测、类型扫描 6 项门禁全部一次性通过。
