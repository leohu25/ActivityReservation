# 任务进度与执行记录：【P0】工作台真实拓扑装配与租户访问门禁 (p0-tenant-workbench-real-topology)

## 阶段任务清单

- [ ] 阶段 1: Researcher 审计工作台动态自驱渲染契约与租户访问门禁阻断逻辑
- [ ] 阶段 2: Coordinator 细化 `assertEmployeeActive` 门禁与工作台数据视图 Spec
- [ ] 阶段 3: Implementer 在 `packages/auth` 与访问守卫处接入 `assertEmployeeActive`
- [ ] 阶段 4: Implementer 重构 `workbench/page.tsx`，移除写死静态 mock 拓扑
- [ ] 阶段 5: Implementer 编写端到端闭环测试（调部门动态生效、停用账号即时阻断）
- [ ] 阶段 6: Reviewer 审查无遗留 mock 数据、Fail-Closed 安全性与全栈门禁

## 实时进度记录

- 2026-09-08: 特性沙盒已创建，定义去 Mock 真实装配与停用状态硬门禁规范。
