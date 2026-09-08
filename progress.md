# 项目推进看板 (Progress Tracker)

> 本文件用于记录团队或智能体在各会话期间的阶段进展、决策历史与真实测试证据。

---

## 一、 当前会话状态 (Current State)

- **当前目标 (Current Objective)**：多租户数据库自动开通与迁移引擎 (`foundation-migration`)
- **激活特性**：`foundation-migration`
- **执行人/角色**：implementer
- **当前阶段**：已完成 (Completed)
- **最后更新 (Last Updated)**：2026-09-08

---

## 二、 工作内容与产出 (What Was Done)

- [x] 在 `packages/db-control` 增加 `TenantMigration` 迁移账本模型与 `TenantMigrationStatus` 状态枚举，扩展 `TenantMigrationRepository` 数据访问层
- [x] 在 `packages/db-tenant` 定义租户独立物理库 Schema（`Department` 部门拓扑、`PurchaseOrder` 采购订单实体）
- [x] 实现 `PgSqlExecutor`、`TenantMigrationRunner` 事务升级引擎与 `TenantProvisioner` 物理库自动开通引擎，支持版本账本追溯、失败阻断、断点重试与降级回滚
- [x] 创建 `tooling/tenant-migrate` 模块，实现基于 Prisma migrate diff 的 Alembic 式实体变更自动扫描生成器 (`tenant-migrate generate <name>`)
- [x] 实现完整的 CLI 命令行工具，支持 `generate`、`up (--all / --tenant)`、`status`、`retry`、`rollback`、`provision` 六大核心运维命令
- [x] 编写 `db-control`、`db-tenant` 与 `tenant-migrate` 多层次单元测试，全仓 6 个测试包 62/62 全部通过
- [x] 全仓 9/9 包类型检查 0 错误，Next.js 生产构建 100% 成功，全栈门禁自检全部通过

---

## 三、 验证证据 (Verification Evidence)

- db-control 专属单元测试 `pnpm --filter @chenrun/db-control test`：6/6 PASS
- db-tenant 专属单元测试 `pnpm --filter @chenrun/db-tenant test`：13/13 PASS
- tenant-migrate 专属单元测试 `pnpm --filter @chenrun/tenant-migrate test`：3/3 PASS
- 全仓单元测试 `pnpm test`：62/62 PASS (6 个测试套件)
- 全仓类型检查 `pnpm check`：9/9 packages PASS
- Next.js 生产构建 `pnpm build`：PASS
- 全栈门禁自检 `./scripts/verify.sh`：PASS（边界合规、62 个源码无红线违规）
- 会话收尾检查 `pnpm session:end`：PASS

---

## 四、 下一步计划 (Recommended Next Step)

- [ ] 切换至第八个特性：`foundation-platform-admin`
- [ ] 推进平台运营商总控面板与租户开通中心 (Platform Super Admin & Provisioning Portal)

---

## 五、 特性总览看板 (Feature Board)

| 特性 ID | 特性名称 | 状态 | 前置依赖 | 验证证据 |
| :--- | :--- | :--- | :--- | :--- |
| `foundation-harness` | Harness 协作工程基础设施 | ✅ 已完成 | 无 | Harness 设施与物理防御闭环 |
| `foundation-monorepo` | Monorepo 与 Next.js 脚手架 | ✅ 已完成 | `foundation-harness` | Turborepo、pnpm workspace、构建通过 |
| `foundation-tenant-auth` | 多租户与身份认证底座 | ✅ 已完成 | `foundation-monorepo` | PostgreSQL 实库集成 1/1、单测 21/21、8/8 check、build、verify、init、Reviewer PASS |
| `foundation-authorization` | 动态角色与能力构建器 | ✅ 已完成 | `foundation-tenant-auth` | PostgreSQL 17 动态角色实库集成 1/1、单测 29/29、8/8 check、build、verify、init PASS |
| `foundation-advanced-authz` | 数据范围与字段权限 | ✅ 已完成 | `foundation-authorization` | 单测 27/27、全仓 39/39、实库 1/1、8/8 check、verify、init、Reviewer PASS |
| `foundation-web-shell` | SaaS Web 门户与主面板框架 | ✅ 已完成 | `foundation-advanced-authz` | App Router 路由拆解、shadcn/ui 集成、实库直连、单测 42/42、check/build 全部 PASS |
| `foundation-migration` | 多租户数据库自动开通与迁移引擎 | ✅ 已完成 | `foundation-web-shell` | Control DB 账本模型、db-tenant 开通与执行器、Alembic 自动扫描生成、CLI 工具、单测 62/62、9/9 check 全部 PASS |
| `foundation-platform-admin` | 平台总控面板与租户开通中心 | ⏳ 待开始 | `foundation-migration` | 依赖已满足 |
| `foundation-tenant-rbac-ui` | 租户角色与四层权限配置中心 | ⏳ 待开始 | `foundation-platform-admin` | 尚未开始 |
| `procurement-center` | 采购中心业务特性验收 | ⏳ 待开始 | `foundation-tenant-rbac-ui` | 尚未开始 |
