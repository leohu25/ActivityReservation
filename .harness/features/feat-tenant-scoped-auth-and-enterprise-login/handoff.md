# 会话换手交接单 — feat-tenant-scoped-auth-and-enterprise-login

## 一、 当前会话状态

- **交付状态**：阶段一推进中 (in_progress)
- **当前分支/工作区**：`feat-tenant-scoped-auth-and-enterprise-login`
- **交接时间**：2026-09-21

## 二、 当前阶段成果 (阶段一)

1. **种子纯化**：将租户初始化 Owner 员工档案合入 `packages/runtime/db/seeds/tenant-seed.sql` 原生 SQL，彻底清除 TS 手写拼接与硬编码数字。
2. **锁升级**：升级 `TenantDatabaseProvisioner` 租户端咨询锁为事务级 `pg_advisory_xact_lock`。
3. **熔断加固**：加固 `apps/control/src/instrumentation.ts` 生产环境 Fail-Fast 阻断机制。
4. **沙盒确权**：正式在 `feature_list.json` 与 `.harness/features/` 建立特性事实源看板，明确划分为 4 大里程碑。

## 三、 下一步立即断点 (Next Actions)

- 消除 `tenant-management/service.ts` 中的老用户密码覆盖代码；
- 跑通阶段一相关单元测试，通过框架防篡改门禁完成阶段一的代码提交。
