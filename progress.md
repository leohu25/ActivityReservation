# 项目推进看板 (Progress Tracker)

> 本文件用于记录团队或智能体在各会话期间的阶段进展、决策历史与真实测试证据。

---

## 一、 当前会话状态 (Current State)

- **当前目标**：多租户与身份认证底座 (`foundation-tenant-auth`)
- **激活特性**：`foundation-tenant-auth`
- **执行人/角色**：implementer
- **当前阶段**：已完成 (Completed)
- **最后更新**：2026-09-07

---

## 二、 工作内容与产出 (What Was Done)

- [x] 配置 Better Auth 1.7.3 邮箱密码认证、Prisma adapter 与 Organization 插件
- [x] 建立 Prisma 7.10 PostgreSQL Control DB Schema，覆盖身份/组织模型及 `TenantDatabase`
- [x] 暴露 Next.js `/api/auth/[...all]` App Router Handler
- [x] 实现基于服务端 Headers、Better Auth Session、Member 和 ACTIVE Mapping 的可信 Tenant Context
- [x] 实现仅通过 `secretRef` 解析连接信息的 Tenant DB Manager
- [x] 实现同租户并发去重、跨租户隔离、evict、closeAll 与关闭竞态保护
- [x] 完成 Reviewer 反馈修复并通过最终独立审查
- [x] 新增 PostgreSQL 17 Docker Compose 本地实库
- [x] 真实执行注册、Organization、Session activeOrganizationId、TenantDatabase 与 Tenant Context 闭环

---

## 三、 验证证据 (Verification Evidence)

- Prisma Schema validate / Client generate：PASS（Prisma 7.10.0）
- `pnpm --filter @chenrun/auth test`：10/10 PASS
- `pnpm --filter @chenrun/db-control test`：3/3 PASS
- `pnpm --filter @chenrun/db-tenant test`：8/8 PASS
- 专属自动化测试合计：21/21 PASS
- PostgreSQL 17 实库集成测试：1/1 PASS
- 集成测试清理后 `user|organization|tenant_database`：`0|0|0`
- `pnpm check`：8/8 packages PASS
- `pnpm build`：PASS，包含动态路由 `/api/auth/[...all]`
- `./scripts/verify.sh`：PASS，27 个变更边界合规、20 个源码无红线违规
- `./init.sh`：PASS，可重启
- Reviewer：PASS / Merge verdict OK

---

## 四、 下一步计划 (Next Steps)

- [ ] 切换至第四个特性：`foundation-authorization`
- [ ] 集成 Better Auth Dynamic Access Control 与 CASL Ability Factory
- [ ] 打通服务端能力校验与 React 权限契约

---

## 五、 特性总览看板 (Feature Board)

| 特性 ID | 特性名称 | 状态 | 前置依赖 | 验证证据 |
| :--- | :--- | :--- | :--- | :--- |
| `foundation-harness` | Harness 协作工程基础设施 | ✅ 已完成 | 无 | Harness 设施与物理防御闭环 |
| `foundation-monorepo` | Monorepo 与 Next.js 脚手架 | ✅ 已完成 | `foundation-harness` | Turborepo、pnpm workspace、构建通过 |
| `foundation-tenant-auth` | 多租户与身份认证底座 | ✅ 已完成 | `foundation-monorepo` | PostgreSQL 实库集成 1/1、单测 21/21、8/8 check、build、verify、init、Reviewer PASS |
| `foundation-authorization` | 动态角色与能力构建器 | ⏳ 待开始 | `foundation-tenant-auth` | 依赖已满足 |
| `foundation-advanced-authz` | 数据范围与字段权限 | ⏳ 待开始 | `foundation-authorization` | 尚未开始 |
| `foundation-migration` | 多租户数据库迁移引擎 | ⏳ 待开始 | `foundation-advanced-authz` | 尚未开始 |
| `procurement-center` | 采购中心业务特性验收 | ⏳ 待开始 | `foundation-migration` | 尚未开始 |
