# 项目推进看板 (Progress Tracker)

> 本文件用于记录团队或智能体在各会话期间的阶段进展、决策历史与真实测试证据。

---

## 一、 当前会话状态 (Current State)

- **当前目标 (Current Objective)**：初始化 Harness 工程基础设施与协同架构
- **激活特性**：`foundation-harness`
- **执行人/角色**：architect
- **当前阶段**：进行中 (In Progress)
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

---

## 三、 下一步计划 (Next Steps)

- [ ] 完成 Harness 基础设施校验
- [ ] 推进至第二步：使用 Next.js 官方脚手架初始化 `apps/tenant` 并搭建 Monorepo 骨架

---

## 四、 特性总览看板 (Feature Board)

| 特性 ID | 特性名称 | 状态 | 前置依赖 | 验证证据 (Verification Evidence) |
| :--- | :--- | :--- | :--- | :--- |
| `foundation-harness` | Harness 协作工程基础设施 | 🔄 进行中 | 无 | 根目录宪法、门禁、.harness 目录生成中 |
| `foundation-monorepo` | Monorepo 与 Next.js 脚手架 | ⏳ 待开始 | `foundation-harness` | 待下一步初始化 apps/tenant 与 packages |
| `foundation-tenant-auth` | 多租户与身份认证底座 | ⏳ 待开始 | `foundation-monorepo` | 依赖 Monorepo 骨架与 Control DB |
| `foundation-authorization` | 授权核心与权限编译器 | ⏳ 待开始 | `foundation-tenant-auth` | 依赖身份底座 |
| `foundation-advanced-authz` | 高级权限引擎 | ⏳ 待开始 | `foundation-authorization` | 依赖基础 RBAC |
| `foundation-migration` | 多租户数据库迁移引擎 | ⏳ 待开始 | `foundation-advanced-authz` | 依赖双 DB 隔离模型 |
| `procurement-center` | 采购中心业务特性验收 | ⏳ 待开始 | `foundation-migration` | 最终全链路闭环验收 |
