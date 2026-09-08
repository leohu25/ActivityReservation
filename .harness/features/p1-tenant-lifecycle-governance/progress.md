# 任务进度与执行记录：【P1】租户全生命周期管控与排期安全清理 (p1-tenant-lifecycle-governance)

## 阶段任务清单

- [ ] 阶段 1: Researcher 审计租户六态生命周期流转与数据库销毁顺序规范
- [ ] 阶段 2: Coordinator 输出 `TenantLifecycleService` 接口与冷静保留期 Spec
- [ ] 阶段 3: Implementer 落地 `TenantLifecycleService` 及单测（严守 R-04）
- [ ] 阶段 4: Implementer 落地租户物理备份与删除流程（先删物理库再删 Control 映射）
- [ ] 阶段 5: Implementer 在 `apps/control` 控制台升级生命周期状态展示与控制操作
- [ ] 阶段 6: Reviewer 审查生命周期流转、R-04 安全红线与全栈门禁

## 实时进度记录

- 2026-09-08: 第二梯队沙盒已创建，定义租户全生命周期与优雅清理规范。
