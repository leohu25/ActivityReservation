# 特性任务看板：通用实体审计基础字段规范与客户中心数据权限闭环 (arch-data-scope-and-base-entity-audit)

## 一、 阶段任务分解

- [ ] **阶段一：实体基础审计与软删除字段规范制定与静态门禁**
  - [ ] 制定通用实体基线字段列表与豁免清单规则
  - [ ] 编写门禁脚本 `scripts/check-entity-baseline.mjs`
  - [ ] 集成至 `scripts/verify.sh` 与构建流水线
- [ ] **阶段二：数据库模式演进与迁移**
  - [ ] 扩展 `packages/features/customer-center/prisma/schema.prisma`（添加 `createdById`, `deptId`, `updatedById`, `isDeleted`, `deletedAt`）
  - [ ] 运行 `pnpm db:sync` 与生成 Canonical Schema (`packages/db-tenant/prisma/schema.generated.prisma`)
  - [ ] 生成并验证数据库迁移脚本
- [ ] **阶段三：客户中心装配层与数据范围能力接入**
  - [ ] 改造 `packages/features/customer-center/src/assembly/context.ts`：引入 `resolveEmployeeTopology` 并调用 `createPrismaAbilityForTenant`
  - [ ] 保证无租户/异常状态下的 Fail-Closed 防护
- [ ] **阶段四：服务层与写路径（Server Action / Service）改造**
  - [ ] `createCustomerAction`：自动注入当前登录人员的 `createdById` 与 `deptId`
  - [ ] `CustomerService.listCustomers`：基于 `getAccessibleWhere(ability, "Customer", "read")` 下推物理查询条件，并追加 `isDeleted: false`
  - [ ] 适配更新与软删除逻辑（`deleteCustomerAction` 标记软删除而非物理删除）
- [ ] **阶段五：专属单元测试与安全攻防验证**
  - [ ] 编写数据权限攻防测试（跨人/跨部门数据隔离性单测）
  - [ ] 验证软删除记录不可见性
  - [ ] 全量类型检查与 `./scripts/verify.sh` 门禁自检

## 二、 实际验证记录

- *待执行任务完成后记录*
