# 项目推进看板 (Progress Tracker)

> 本文件用于记录团队或智能体在各会话期间的阶段进展、决策历史与真实测试证据。

---

## 一、 当前会话状态 (Current State)

- **当前目标 (Current Objective)**：SaaS Web 门户与主面板框架 (`foundation-web-shell`)
- **激活特性**：`foundation-web-shell`
- **执行人/角色**：implementer
- **当前阶段**：已完成 (Completed)
- **最后更新 (Last Updated)**：2026-09-08

---

## 二、 工作内容与产出 (What Was Done)

- [x] 配置不入版本控制的 `.env.local` 环境变量，直连本地 Docker PostgreSQL 容器实库端口
- [x] 基于 Next.js 16 App Router 拆解组织标准页面路由：`/`、`/login`、`/workbench`、`/procurement/orders`
- [x] 深度集成 **shadcn/ui** 设计体系 (`Button`, `Card`, `Input`, `Badge`, `cn`) 并升级 `<PermissionField>`
- [x] 前后端实库直连消除写死数据：基于 Better Auth 会话与 Control DB 动态编译 CASL Ability
- [x] 编写 UI 组件测试，全仓 5 个测试包 42/42 全部通过
- [x] 全仓 8/8 包类型检查通过，Next.js 6 个动静态路由生产构建 100% 成功，全栈门禁验证通过

---

## 三、 验证证据 (Verification Evidence)

- UI 专属单元测试 `pnpm --filter @chenrun/ui test`：3/3 PASS
- 全仓单元测试 `pnpm test`：42/42 PASS
- 全仓类型检查 `pnpm check`：8/8 packages PASS
- Next.js 生产构建 `pnpm build`：PASS（6 个 App Router 路由）
- 全栈门禁自检 `./scripts/verify.sh`：PASS（边界合规、56 个源码无红线违规）
- 环境自检 `./init.sh`：PASS
- 会话收尾检查 `pnpm session:end`：PASS

---

## 四、 下一步计划 (Recommended Next Step)

- [ ] 切换至第七个特性：`foundation-migration`
- [ ] 推进多租户数据库迁移引擎 (Tenant DB Migration CLI)

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
| `foundation-migration` | 多租户数据库自动开通与迁移引擎 | ⏳ 待开始 | `foundation-web-shell` | 依赖已满足 |
| `foundation-platform-admin` | 平台总控面板与租户开通中心 | ⏳ 待开始 | `foundation-migration` | 尚未开始 |
| `foundation-tenant-rbac-ui` | 租户角色与四层权限配置中心 | ⏳ 待开始 | `foundation-platform-admin` | 尚未开始 |
| `procurement-center` | 采购中心业务特性验收 | ⏳ 待开始 | `foundation-tenant-rbac-ui` | 尚未开始 |
