# 特性交接备忘录：通用实体审计基础字段规范与客户中心数据权限闭环 (arch-data-scope-and-base-entity-audit)

## 一、 特性完成概览

本特性确立了 ERP 全业务实体的框架审计与软删除基线，落地了自动化架构门禁脚本，并在客户中心（`customer-center`）打通了从用户 Session、部门架构拓扑解析、CASL PrismaAbility 数据范围编译、到服务层 `getAccessibleWhere` 与 `isDeleted: false` 物理下推的端到端数据权限与软删除链路。

### 1. 业务实体基础审计字段基线 (SSoT)

- `createdById`: String (创建人 ID)
- `deptId`: String? (归属部门 ID，支撑行级数据范围 SELF / DEPT / DEPT_TREE 判定)
- `updatedById`: String? (最后更新人 ID)
- `createdAt`: DateTime (创建时间)
- `updatedAt`: DateTime (更新时间)
- `isDeleted`: Boolean (软删除状态标记)
- `deletedAt`: DateTime? (软删除时间)
- `deletedById`: String? (软删除操作人 ID)

### 2. 核心落地组件

1. **静态门禁脚本**：`scripts/check-entity-baseline.mjs`，强制扫描业务模型必须满足上述基线，并在 `scripts/verify.sh` 挂载执行；单测位于 `scripts/check-entity-baseline.test.mjs`。
2. **Schema 扩展与基线**：Customer、CustomerStore、CustomerQuote 等实体全面扩展审计字段，完成 Canonical Schema 同步与数据库基线迁移。
3. **客户中心装配层改造**：`packages/features/customer-center/src/assembly/context.ts` 自驱调用 `resolveEmployeeTopology` 并通过 `createPrismaAbilityForTenant` 编译出带行级条件的 `AppPrismaAbility`。
4. **服务层下推与显式过滤**：`CustomerService.listCustomers` 统一组合 `getAccessibleWhere(ability, "Customer", "read")` 与 `{ isDeleted: false }`；`createCustomerAction` / `createStoreAction` 自动落盘 `createdById` 与 `deptId`。
5. **集成攻防测试**：`packages/features/customer-center/src/features/customer-management/data-scope.integration.test.ts` 完整覆盖 SELF、DEPT、DEPT_TREE、ALL / owner 各种数据范围在数据库查询中的物理生成和隔离效果。

---

## 二、 验证结果

- `./scripts/verify.sh`：沙盒边界、架构红线、实体基线、业务切片、门禁单测、全量类型扫描 6 项门禁全部 100% 通过。
- 客户中心专属单测与集成测试：20/20 全部通过。
