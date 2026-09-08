# 换手交接单：【P0】工作台真实拓扑装配与租户访问门禁 (p0-tenant-workbench-real-topology)

## 状态总览

- 当前状态: COMPLETED (实施与自动化测试全绿)
- 负责人: @implementer -> @coordinator
- 前置依赖: `p0-tenant-org-management` (已完成)
- 第一梯队里程碑: **P0 全部 5 个特性已 100% 圆满闭环交付！**

## 交付清单

1. `packages/auth/src/tenant-context.ts` & `src/index.ts`:
   - 落地 `assertTenantAccessGate` 与 `assertEmployeeActive` 访问门禁函数；
   - 增加 `EMPLOYEE_PROFILE_NOT_FOUND`、`EMPLOYEE_SUSPENDED`、`EMPLOYEE_TERMINATED`、`EMPLOYEE_NOT_ACTIVE` 错误码；
   - `tenant-context.test.ts` 补充 5 个门禁单测（覆盖在职、未激活、停用、离职、档案不存在）。
2. `packages/features/procurement-center/src/server/session.ts`:
   - 在 `getTenantProcurementContext` 中接入 `assertTenantAccessGate`，确保所有采购中心 Server Actions 自动拦截非在职员工。
3. `apps/tenant/src/app/(dashboard)/workbench/page.tsx`:
   - 彻底删除写死的 `dept_procurement_east` / `dept_procurement_east_sub` 静态 mock 拓扑；
   - 直连当前租户物理数据库，查询真实 `EmployeeProfile` 与关联的 `Department`、`Position`；
   - 接入 `assertTenantAccessGate`，若员工被停用展示专用的业务准入受限卡片；
   - 调用 `resolveEmployeeTopology` 动态装配部门树，编译 CASL Ability 并展示真实的下推 SQL Where 条件与字段策略。
4. `packages/features/procurement-center/src/services/workbench-real-topology.test.ts`:
   - 验证工作台页面源码无 mock；
   - 验证准入门禁对非 ACTIVE 成员的严格拦截；
   - 验证调部门后 CASL accessibleBy 下推条件实时动态切换。
5. 门禁验证:
   - 全仓 9 个测试套件 96/96 单测 100% PASS，12 个包类型检查 0 错误，`./scripts/verify.sh` 通过。
