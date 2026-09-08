# 换手交接单：【P0】租户开通与初始数据种子初始化 (p0-tenant-seed-and-provisioning)

## 状态总览

- 当前状态: COMPLETED (实施与单测验证全绿)
- 负责人: @implementer -> @coordinator
- 前置依赖: `p0-org-schema-and-entities` (已就绪)
- 后续承接特性: `p0-tenant-navigation-and-settings`

## 实施交付物清单

1. `packages/db-tenant/src/database-seeder.ts`:
   - 落地 `TenantDatabaseSeeder` 类与 `seedTenantBaseline` 辅助函数；
   - 幂等初始化根部门 ROOT、3 个基础岗位字典（总经理、部门主管、业务专员）与初始 Owner 员工档案 (ACTIVE 在职态)。
2. `packages/db-tenant/src/tenant-provisioner.ts`:
   - 扩展 `ProvisionTenantDatabaseInput` 支持 `seedInput`；
   - 物理建库并成功完成基线 Schema 迁移后，自动调用 Seeder 完成基线数据填充并返回 `seedResult`。
3. `packages/features/control-admin/src/services/control-admin.ts`:
   - 为 Owner 用户生成初始密码凭据，在 Control DB 写入加密的 credential 密码账号；
   - 在 Control DB 为该租户初始化预置四层角色策略 (`owner`, `admin`, `buyer`)；
   - 串联调用带 Seeder 的 `TenantProvisioner` 并将初始密码返回在 `ProvisionTenantResult`。
4. `packages/features/control-admin/src/components/ProvisionTenantDialog.tsx` & `TenantsView.tsx`:
   - 弹窗在成功开通后，展示生成的初始密码与一键复制提示卡片。
5. 测试用例:
   - `packages/db-tenant/src/database-seeder.test.ts`
   - `packages/features/control-admin/src/control-admin.test.ts`
   - 全仓 9 套件 93/93 单测 100% 通过，全栈门禁 `./scripts/verify.sh` PASS。

## 移交至下阶段注意事项

下一特性 `p0-tenant-navigation-and-settings` 可直接基于已完成开通与 Seed 的租户，重构多级分组导航目录树与落地企业设置三大页面。
