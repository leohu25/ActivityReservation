# 特性任务推进看板 — feat-tenant-scoped-auth-and-enterprise-login

## 一、 阶段里程碑与推进分解

### 阶段一：Day 0 种子纯化与老用户密码覆盖安全拦截 (已就绪待收敛)
- [x] 将租户初始化 Owner 档案写入并入 `packages/runtime/db/seeds/tenant-seed.sql` 物理原生 SQL，消除 TS 拼接
- [x] 消除 `database-seeder.ts` 中 `Math.max(0, 3)` 岗位计数硬编码
- [x] 升级 `tooling/db-migrate/src/runtime/provisioner.ts` 租户咨询锁为事务级 `pg_advisory_xact_lock`
- [x] 加固 `apps/control/src/instrumentation.ts` 生产环境 Fail-Fast 阻断机制
- [ ] 彻底移除 `packages/platform/control-admin/.../tenant-management/service.ts` 中老用户密码覆盖代码，并在用户已存在时安全返回

### 阶段二：租户独立凭证 Schema 设计与数据模型迁移
- [ ] 在 `packages/base/db-control/prisma/schema.prisma` 引入 `TenantCredential`（支持 `organizationId + account` 复合唯一索引）
- [ ] 生成平台库增量迁移并在运行时注册 Catalog
- [ ] 编写凭证生成、校验与 Scrypt 安全哈希领域服务

### 阶段三：租户端“企业编码 + 账号/手机号 + 密码”三要素登录服务
- [ ] 租户端实现基于 `[slug, account, password]` 的独立验证 Action
- [ ] 校验通过后通过 Better Auth 适配器创建绑定当前组织的标准 Session 与 HttpOnly Cookie
- [ ] 消除登录后选择租户的多余弹窗，实现直接进入目标企业工作台

### 阶段四：租户员工管理与界面交互全链路改造
- [ ] 改造租户端员工录入表单（支持账号/手机号/工号作为登录标识，消除邮箱强校验）
- [ ] 改造平台管控开通租户表单，明确企业所有者登录标识
- [ ] 补齐全链路单元测试、类型检查与全栈门禁验证

## 二、 阶段推进记录
- 2026-09-21: 初始化沙盒看板，采纳 Jev 架构评估结论（91% 置信度建议采用租户私有凭据表 + 独立 Session 生成模式）。
