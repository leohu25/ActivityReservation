# 项目推进看板 (Progress Tracker)

> 本文件用于记录团队或智能体在各会话期间的阶段进展、决策历史与真实测试证据。

---

## 一、 当前会话状态 (Current State)

- **当前目标 (Current Objective)**：数据与字段权限引擎 (`foundation-advanced-authz`)
- **激活特性**：`foundation-advanced-authz`
- **执行人/角色**：implementer
- **当前阶段**：已完成 (Completed)
- **最后更新 (Last Updated)**：2026-09-08

---

## 二、 工作内容与产出 (What Was Done)

- [x] 在 `AGENTS.md` 中持久化架构原则：高内聚低耦合单一职责、全中文注释规范与零 any 纪律
- [x] 实现支持 `SELF`, `DEPT`, `DEPT_TREE`, `CUSTOM`, `ALL` 五种范围的数据权限引擎与 Fail-Closed 兜底
- [x] 实现字段权限 `HIDDEN`, `READONLY`, `EDITABLE` 三态读写拦截策略
- [x] 基于 `@casl/prisma` 实现 Prisma `where` 条件安全提取器 `getAccessibleWhere`
- [x] 扩展 `CaslAbilityFactory` 生成支持数据范围与字段策略的 `AppPrismaAbility`
- [x] 修复 Action 维度隔离与空值防御，通过独立 Reviewer 严格审计并取得 PASS
- [x] 完成全套单元测试 (27/27) 与实库集成验证，全栈门禁 100% 通过

---

## 三、 验证证据 (Verification Evidence)

- `pnpm --filter @chenrun/authorization test`：27/27 PASS
- 全仓单元测试 `pnpm test`：39/39 PASS
- PostgreSQL 17 实库授权集成测试：1/1 PASS
- 全仓类型检查 `pnpm check`：8/8 packages PASS
- 全栈门禁自检 `./scripts/verify.sh`：PASS，边界合规、40 个源码无红线违规
- 可重启自检 `./init.sh`：PASS，环境就绪
- Reviewer 独立审查：PASS / Merge verdict OK

---

## 四、 下一步计划 (Recommended Next Step)

- [ ] 切换至第六个特性：`foundation-migration`
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
| `foundation-migration` | 多租户数据库迁移引擎 | ⏳ 待开始 | `foundation-advanced-authz` | 依赖已满足 |
| `procurement-center` | 采购中心业务特性验收 | ⏳ 待开始 | `foundation-migration` | 尚未开始 |
