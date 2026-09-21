# 特性任务推进看板 — feat-tenant-scoped-auth-and-enterprise-login

## 一、 阶段里程碑与推进分解

### 阶段一：Day 0 种子纯化与老用户密码覆盖安全拦截 (已完成)
- [x] 将租户初始化 Owner 档案写入并入 `packages/runtime/db/seeds/tenant-seed.sql` 物理原生 SQL，消除 TS 拼接
- [x] 消除 `database-seeder.ts` 中 `Math.max(0, 3)` 岗位计数硬编码
- [x] 升级 `tooling/db-migrate/src/runtime/provisioner.ts` 租户咨询锁为事务级 `pg_advisory_xact_lock`
- [x] 加固 `apps/control/src/instrumentation.ts` 生产环境 Fail-Fast 阻断机制
- [x] 移除 `packages/platform/control-admin` 中老用户密码覆盖代码

### 阶段二：租户独立凭证 Schema 设计与数据模型迁移 (已完成)
- [x] 在 `packages/base/db-control/prisma/schema.prisma` 引入 `TenantAccount`（支持 `organizationId + account` 复合唯一索引）
- [x] 重置并生成全新平台基线工件 `packages/runtime/db/baselines/platform/20260921150838/`
- [x] 更新 `PlatformMigrationRunner` 核心表与测试假客户端

### 阶段三：租户端“企业编码 + 账号/手机号 + 密码”三要素登录服务 (已完成)
- [x] 在 `@base/auth` 落地 `authenticateTenantUser` 领域服务与 Scrypt 密码校验单测 (16/16 全绿)
- [x] 租户端落地 `/api/auth/tenant-login` 服务端端点，完成与 Better Auth Session 的自愈签发
- [x] 租户端登录页重构为工业级三要素表单 (企业编码 + 账号/工号/手机号 + 密码)，彻底消除“二选一”选择弹窗

### 阶段四：租户员工管理与开通交互全链路改造 (已完成)
- [x] 重构平台开通租户服务，无论平台 User 是否存在，在新租户下原子写入专属 `TenantAccount`
- [x] 重构租户员工管理服务，录入员工时自动写入租户专属 `TenantAccount`
- [x] 全仓编译检查 (tenant/control/@base/auth) 0 TS 错误，单测 122/122 全绿

## 二、 阶段推进记录
- 2026-09-21: 采纳 Jev 架构决策，在未上线阶段一步到位彻底完成多租户独立凭据体系重构。
