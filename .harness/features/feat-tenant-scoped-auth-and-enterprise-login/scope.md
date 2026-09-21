# 特性范围说明 — feat-tenant-scoped-auth-and-enterprise-login

## 核心定位与背景

本特性旨在将平台当前通用的“互联网消费级全局邮箱通行证模型”升级重构为适合严肃 ToB ERP 的“企业作用域独立凭证体系（Tenant-Scoped Credentials）”，支持租户内自定义账号、工号和手机号，彻底杜绝跨租户同名串号与密码覆盖灾难。

## 允许修改的文件与目录 (修改白名单)

- `feature_list.json`
- `.harness/features/feat-tenant-scoped-auth-and-enterprise-login/**`
- `packages/base/auth/**`
- `packages/base/db-control/prisma/schema.prisma`
- `packages/base/db-tenant/src/seed/**`
- `packages/runtime/db/seeds/**`
- `packages/platform/control-admin/src/features/tenant-management/**`
- `packages/platform/tenant-admin/src/features/org-management/employee/**`
- `apps/tenant/src/app/(auth)/**`
- `apps/control/src/instrumentation.ts`
- `tooling/db-migrate/src/runtime/**`

## 严禁修改的内容 (受保护区域)

- 严禁破坏非关联的业务切片（如 `customer-center`, `order-center` 等）；
- 严禁绕过 PostgreSQL Database-per-tenant 动态物理分库路由；
- 严禁破坏 CASL 四层权限闭环防御。
