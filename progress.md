# 项目推进看板 (Progress Tracker)

> 本文件用于记录团队或智能体在各会话期间的阶段进展、决策历史与真实测试证据。

---

## 一、 当前会话状态 (Current State)

- **当前目标 (Current Objective)**：授权核心与能力构建器 (`foundation-authorization`)
- **激活特性**：`foundation-authorization`
- **执行人/角色**：implementer
- **当前阶段**：已完成 (Completed)
- **最后更新 (Last Updated)**：2026-09-08

---

## 二、 工作内容与产出 (What Was Done)

- [x] 建立 Better Auth Access Control statement 与强类型权限目录
- [x] 通过应用 composition root 聚合采购切片权限且保留 Better Auth 默认 statements/roles
- [x] 启用 Organization Dynamic Access Control
- [x] 增加 Control DB `OrganizationRole` Schema 与组织隔离查询
- [x] 实现动态/内置角色权限到 CASL Ability 的编译器
- [x] 实现服务端 `RequireAbility`/`ForbiddenError` 薄适配
- [x] 实现 React AbilityProvider、Can 与 Permission 组件
- [x] 编写单元测试与 PostgreSQL 17 实库集成测试
- [x] 运行 check、build、verify 与 init

---

## 三、 验证证据 (Verification Evidence)

- Prisma Schema validate / Client generate：PASS（Prisma 7.10.0）
- `pnpm --filter @chenrun/auth test`：10/10 PASS
- `pnpm --filter @chenrun/db-control test`：4/4 PASS
- `pnpm --filter @chenrun/authorization test`：7/7 PASS
- `pnpm --filter @chenrun/db-tenant test`：8/8 PASS
- 专属自动化单元测试合计：29/29 PASS
- PostgreSQL 17 实库授权集成测试：1/1 PASS
- 集成测试清理后 `user|organization|organizationRole|tenant_database`：`0|0|0|0`
- `pnpm check`：8/8 packages PASS（含 `catalog.type-contract.tsx` 负向类型约束）
- `pnpm build`：PASS，应用包含 Dynamic Access Control 路由
- `./scripts/verify.sh`：PASS，边界合规且无红线违规
- `./init.sh`：PASS，可重启
- Reviewer：PASS / Merge verdict OK

---

## 四、 下一步计划 (Recommended Next Step)

- [ ] 切换至第五个特性：`foundation-advanced-authz`
- [ ] 推进基于 `@casl/prisma` 的五种数据范围查询下推与 CASL 字段权限拦截

---

## 五、 特性总览看板 (Feature Board)

| 特性 ID | 特性名称 | 状态 | 前置依赖 | 验证证据 |
| :--- | :--- | :--- | :--- | :--- |
| `foundation-harness` | Harness 协作工程基础设施 | ✅ 已完成 | 无 | Harness 设施与物理防御闭环 |
| `foundation-monorepo` | Monorepo 与 Next.js 脚手架 | ✅ 已完成 | `foundation-harness` | Turborepo、pnpm workspace、构建通过 |
| `foundation-tenant-auth` | 多租户与身份认证底座 | ✅ 已完成 | `foundation-monorepo` | PostgreSQL 实库集成 1/1、单测 21/21、8/8 check、build、verify、init、Reviewer PASS |
| `foundation-authorization` | 动态角色与能力构建器 | ✅ 已完成 | `foundation-tenant-auth` | PostgreSQL 17 动态角色实库集成 1/1、单测 29/29、8/8 check、build、verify、init PASS |
| `foundation-advanced-authz` | 数据范围与字段权限 | ⏳ 待开始 | `foundation-authorization` | 尚未开始 |
| `foundation-migration` | 多租户数据库迁移引擎 | ⏳ 待开始 | `foundation-advanced-authz` | 尚未开始 |
| `procurement-center` | 采购中心业务特性验收 | ⏳ 待开始 | `foundation-migration` | 尚未开始 |
