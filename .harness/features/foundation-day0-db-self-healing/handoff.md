# 会话换手交接单: 平台与租户数据库 Day 0 自愈初始化

## 一、当前会话状态

- **交付状态**：已完成
- **分支/Commit**：main / 未提交
- **交接时间**：2026-09-11

## 二、关键产出与变更文件

1. **发布态与运行态彻底解耦**：
   - 彻底删除 `apps/control/src/instrumentation.ts` 与 `apps/tenant/src/instrumentation.ts`，杜绝 `next build` / CI 预渲染时隐式执行 DDL。
   - 移除 `packages/auth/src/server/server.ts` 中 `getCurrentTenantContext` 对 ensure 的高频拦截，保证业务请求直连连接池，杜绝 Serverless 冷启动惊群。保留 `ensureServerAuthDatabase` 为独立工具函数。
   - 恢复 `packages/features/control-admin/src/server/session.ts` 与 `auth-runtime.ts` 为轻量同步获取。
   - 恢复 `apps/control/src/app/api/auth/[...all]/route.ts` 为纯净的标准 `toNextJsHandler` 导出。
   - `pnpm run dev:control` 与 `./init.sh` 保留 `pnpm db:platform:ensure` 作为前置命令行门禁。

2. **事务级锁与连接池兼容性加固**：
   - 在 `tooling/db-migrate/src/runtime/platform-runner.ts` 中，使用事务级 `pg_advisory_xact_lock` 替代会话级锁，并在加锁前设置 `SET LOCAL lock_timeout = '15s'`，随事务提交/回滚自动释放，天然兼容 PgBouncer 事务连接池并防止死锁挂起。

3. **空库判定升级为 Ledger-First**：
   - 废除对 public schema 表总数为 0 的绝对限制。
   - 判定规则：`platform_migration` 账本不存在且核心表（`user`, `organization`, `session`）均不存在时判定为 `EMPTY`（兼容云厂商预装扩展表如 `spatial_ref_sys`）；若账本表缺失但已有核心表，严格判定为 `PARTIAL` 阻断。

4. **统一超管配置事实源**：
   - 在 `packages/features/control-admin/src/auth/control-guard.ts` 中，若 `CONTROL_ADMIN_EMAILS` 未配置，自动回退检查 `CONTROL_BOOTSTRAP_ADMIN_EMAIL`；生产环境下若均未配置，严格返回空列表（Fail-Closed）。

## 三、门禁与测试回执

- `pnpm --filter @base/db-migrate test`：18/18 PASS。
- `pnpm --filter @base/feature-control-admin test`：3/3 PASS。
- `pnpm --filter @base/db-tenant test`：25/25 PASS。
- `pnpm --filter @base/auth test`：15/15 PASS。
- `pnpm --filter @base/db-control test`：7/7 PASS。
- `pnpm check` (全仓 13 个包)：13/13 PASS，0 错误。
- `pnpm test` (全仓单测)：11/11 测试包全部 PASS (总计 140+ 单测全绿)。
- `./init.sh` 5 步自检通过。

## 四、遗留风险与下一步断点

- 生产环境部署时，推荐在 CI/CD 流水线或 Kubernetes InitContainer / Entrypoint 中执行 `pnpm db:platform:ensure`。
