# 项目推进看板 (Progress Tracker)

> 本文件用于记录团队或智能体在各会话期间的阶段进展、决策历史与真实测试证据。

---

## 一、 当前会话状态 (Current State)

- **当前目标 (Current Objective)**：Monorepo 骨架与 Next.js 官方脚手架初始化
- **激活特性**：`foundation-monorepo`
- **执行人/角色**：implementer
- **当前阶段**：已完成 (Completed)
- **最后更新 (Last Updated)**：2025-05-18

---

## 二、 工作内容与产出 (What Was Done)

- [x] 读取分析架构全量文档与设计规范
- [x] 建立全中文 AGENTS.md 宪法、CLAUDE.md、member.local.example.md
- [x] 梳理并写入 feature_list.json 全局特性总账
- [x] 建立 .harness/ 基础设施与采购中心沙盒文件
- [x] 编写全中文 init.sh 与 scripts/verify.sh、scripts/status.sh
- [x] 实现沙盒修改白名单物理拦截脚本 `scripts/check-boundary.mjs`
- [x] 实现多租户架构与权限安全红线静态扫描器 `scripts/check-redlines.mjs`
- [x] 在 `init.sh` 中自动配置 Git `pre-commit` 门禁钩子并打通全栈验证链
- [x] 配置 Monorepo 根基座 `pnpm-workspace.yaml`、`turbo.json`、`tsconfig.base.json`
- [x] 使用官方推荐脚手架 `create-next-app` 初始化 `apps/tenant` (Next.js 16.3 + Tailwind 4)
- [x] 初始化 packages 基础模块骨架 (`@chenrun/shared`, `foundation`, `db-control`, `db-tenant`, `ui`, `procurement-center`)
- [x] 全栈 7 个 packages 类型扫描 `pnpm check` 与 Next.js `pnpm build` 全部 100% 成功

---

## 三、 下一步计划 (Next Steps)

- [ ] 切换至第三个特性：`foundation-tenant-auth` (多租户与身份认证底座)
- [ ] 建立 saas_control Control DB 的 Prisma 模型与 Tenant Context 解析中间件

---

## 四、 特性总览看板 (Feature Board)

| 特性 ID | 特性名称 | 状态 | 前置依赖 | 验证证据 (Verification Evidence) |
| :--- | :--- | :--- | :--- | :--- |
| `foundation-harness` | Harness 协作工程基础设施 | ✅ 已完成 | 无 | 全中文宪法、100/100 Harness 设施与物理防御闭环 |
| `foundation-monorepo` | Monorepo 与 Next.js 脚手架 | ✅ 已完成 | `foundation-harness` | 官方 create-next-app 初始化，Turborepo + pnpm workspace，7/7 check + build 通过 |
| `foundation-tenant-auth` | 多租户与身份认证底座 | ⏳ 待开始 | `foundation-monorepo` | 依赖 Monorepo 骨架，基于 Better Auth + Organization 与 Control DB |
| `foundation-authorization` | 动态角色与能力构建器 | ⏳ 待开始 | `foundation-tenant-auth` | 依赖身份底座，基于 Better Auth 动态角色与 CASL Ability Factory |
| `foundation-advanced-authz` | 数据范围与字段权限 | ⏳ 待开始 | `foundation-authorization` | 基于 @casl/prisma 与 CASL Fields 下推过滤 |
| `foundation-migration` | 多租户数据库迁移引擎 | ⏳ 待开始 | `foundation-advanced-authz` | 依赖双 DB 隔离模型 |
| `procurement-center` | 采购中心业务特性验收 | ⏳ 待开始 | `foundation-migration` | 最终全链路闭环验收 |
