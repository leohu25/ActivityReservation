# 任务进度与执行记录：【P0】工作台真实拓扑装配与租户访问门禁 (p0-tenant-workbench-real-topology)

## 阶段任务清单

- [x] 阶段 1: Researcher 审计工作台动态自驱渲染契约与租户访问门禁阻断逻辑
- [x] 阶段 2: Coordinator 细化 `assertEmployeeActive` 门禁与工作台数据视图 Spec
- [x] 阶段 3: Implementer 在 `packages/auth` 与访问守卫处接入 `assertTenantAccessGate`
- [x] 阶段 4: Implementer 重构 `workbench/page.tsx`，彻底移除写死静态 mock 拓扑
- [x] 阶段 5: Implementer 编写端到端闭环测试（调部门动态生效、停用账号即时阻断）
- [x] 阶段 6: Reviewer 审查无遗留 mock 数据、Fail-Closed 安全性与全栈门禁

## 实时进度记录

- 2026-09-08: 特性沙盒已创建，定义去 Mock 真实装配与停用状态硬门禁规范。
- 2026-09-08: 在 packages/auth/src/tenant-context.ts 落地 assertTenantAccessGate 与 assertEmployeeActive 准入门禁，覆盖 5 个针对 ACTIVE/SUSPENDED/TERMINATED/INVITED/null 的单测。
- 2026-09-08: 在 packages/features/procurement-center/src/server/session.ts 中将 getTenantProcurementContext 接入 assertTenantAccessGate，实现非在职员工自动 Fail-Closed 业务拦截。
- 2026-09-08: 彻底重构 apps/tenant/src/app/(dashboard)/workbench/page.tsx，删除所有 mock 拓扑与 mock 部门字符串，改为直连 Tenant DB 查询真实 EmployeeProfile、自驱调用 resolveEmployeeTopology 装配部门树、动态编译 CASL Ability 并展示真实下推 SQL 与字段三态保护。
- 2026-09-08: 新增 packages/features/procurement-center/src/services/workbench-real-topology.test.ts，验证源码无 mock、准入门禁严格拦截以及调部门后下推 SQL 实时切换；全仓 9 套件 96/96 单测 100% 通过，12 个包类型检查 0 错误，./scripts/verify.sh 全绿。
