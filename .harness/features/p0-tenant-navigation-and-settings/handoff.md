# 换手交接单：【P0】租户后台多级导航与企业/基础/安全设置中心 (p0-tenant-navigation-and-settings)

## 状态总览

- 当前状态: COMPLETED (实施与门禁验证均已完成)
- 负责人: @implementer -> @coordinator
- 前置依赖: `p0-tenant-seed-and-provisioning` (已完成)
- 后续承接特性: `p0-tenant-org-management` (组织架构中心)

## 交付清单

1. `packages/ui/src/components/layout/Sidebar.tsx`：
   - 升级为符合规范第 48 节的多级分组折叠导航目录树；
   - 支持业务中心、系统管理（组织架构、权限管理、企业设置、审计日志占位）；
   - 支持根据当前路由自动展开激活、手风琴折叠交互、`can` 回调过滤与纯矢量图标。
2. `packages/ui/src/Sidebar.test.ts`：
   - 覆盖分组渲染、路径展开高亮、权限过滤等全部交互。
3. `packages/features/tenant-admin`：
   - `TenantSettingsService` 领域服务：读写 Tenant DB `CompanyProfile`、Control DB `Organization.metadata`（基础与安全设置）；
   - `tenant-settings-service.test.ts` 单测（读写、边界校验与异常拦截）；
   - Server Actions（`updateCompanyProfileAction`、`updateGeneralSettingsAction`、`updateSecuritySettingsAction`）；
   - `CompanySettingsView`、`GeneralSettingsView`、`SecuritySettingsView` 三大现代工业风面板组件。
4. `apps/tenant/src/app/(dashboard)/settings/`：
   - 挂载 `/settings/company/page.tsx`、`/settings/general/page.tsx`、`/settings/security/page.tsx` 极薄服务端路由。
5. 门禁验证：
   - 全仓 9 套件 93/93 单测全通，12 包类型 0 错误，`./scripts/verify.sh` 通过。
