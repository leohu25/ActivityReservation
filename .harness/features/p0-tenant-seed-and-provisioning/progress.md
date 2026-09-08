# 任务进度与执行记录：【P0】租户开通与初始数据种子初始化 (p0-tenant-seed-and-provisioning)

## 阶段任务清单

- [ ] 阶段 1: Researcher 审计 Tenant DB Seed 工厂与 Owner 初始凭证生成规则
- [ ] 阶段 2: Coordinator 输出 Seed 结构契约与开通入参 Spec
- [ ] 阶段 3: Implementer 在 `packages/db-tenant` 中落地 `TenantDatabaseSeeder`（ROOT 部门、Position 字典、Owner 档案）
- [ ] 阶段 4: Implementer 升级 `ControlAdminService.provisionTenant`，建库迁移后自动触发 Seed 与初始角色初始化
- [ ] 阶段 5: Implementer 在 `apps/control` 开通弹窗中增强凭证展示（显示 Owner 初始随机密码）
- [ ] 阶段 6: Reviewer 审查开通幂等性、R-01 规则与全栈门禁

## 实时进度记录

- 2026-09-08: 特性沙盒已创建，定义租户开通自动 Seed 契约与凭证生成规则。
