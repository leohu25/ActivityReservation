# 任务进度与执行记录：【P0】租户开通与初始数据种子初始化 (p0-tenant-seed-and-provisioning)

## 阶段任务清单

- [x] 阶段 1: Researcher 审计 Tenant DB Seed 工厂与 Owner 初始凭证生成规则
- [x] 阶段 2: Coordinator 输出 Seed 结构契约与开通入参 Spec
- [x] 阶段 3: Implementer 在 `packages/db-tenant` 中落地 `TenantDatabaseSeeder`（ROOT 部门、Position 字典、Owner 档案）
- [x] 阶段 4: Implementer 升级 `ControlAdminService.provisionTenant`，建库迁移后自动触发 Seed 与初始角色初始化
- [x] 阶段 5: Implementer 在 `apps/control` 开通弹窗中增强凭证展示（显示 Owner 初始随机密码）
- [x] 阶段 6: Reviewer 审查开通幂等性、R-01 规则与全栈门禁

## 实时进度记录

- 2026-09-08: 特性沙盒已创建，定义租户开通自动 Seed 契约与凭证生成规则。
- 2026-09-08: 在 packages/db-tenant 实现 TenantDatabaseSeeder 并导出 seedTenantBaseline 辅助函数；支持幂等填充 ROOT 部门、总经理/主管/专员 3 默认岗位字典与 Owner EmployeeProfile。
- 2026-09-08: 升级 TenantProvisioner 支持并在物理库迁移后自动调用 seeder 完成数据填充。
- 2026-09-08: 升级 ControlAdminService.provisionTenant，生成初始密码并在 Control DB 为 Owner 用户创建 credential 密码账号；在 Control DB 为该租户初始化预置四层角色策略 (owner, admin, buyer)；严格守护 R-01 规则。
- 2026-09-08: 升级 ProvisionTenantDialog 与 TenantsView，开通成功后平滑展示初始管理员密码卡片并支持一键复制凭据。
- 2026-09-08: 补全 database-seeder.test.ts 与 control-admin.test.ts 单测，全仓 9 套件 93/93 单测 100% PASS，12 包类型检查 0 错误，全栈门禁 ./scripts/verify.sh PASS。
