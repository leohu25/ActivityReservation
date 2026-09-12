# 会话换手交接单：数据与字段权限引擎 (foundation-advanced-authz)

- **目标特性**：数据与字段权限引擎 (`foundation-advanced-authz`)
- **当前状态**：已完成 (Completed)
- **分支**：`gemini`
- **日期**：2026-09-08

## 本次完成内容

1. **工程宪法落地**：在 `AGENTS.md` 中补充并固化了“高内聚低耦合单一职责”、“全中文代码注释规范”以及“TypeScript 强类型与零 any 纪律”。
2. **数据范围引擎 (`data-scope.ts`)**：支持五种数据范围（`SELF`, `DEPT`, `DEPT_TREE`, `CUSTOM`, `ALL`），严格实现缺少部门或空枚举时的 Fail-Closed 机制，多角色范围通过 OR 并集融合。
3. **字段策略引擎 (`field-policy.ts`)**：推导 `HIDDEN`, `READONLY`, `EDITABLE` 三态，提供白名单字段读取与过滤 (`pickReadableFields`) 以及非可写字段变更拦截 (`assertEditableFields`)。
4. **Prisma 查询下推 (`prisma-access.ts`)**：基于 `@casl/prisma` 提取兼容 Prisma 的 `where` 查询条件，Fail-Closed 归一化拦截。
5. **Ability 工厂升级 (`ability-factory.ts`)**：支持编译 `AppPrismaAbility`，按 Action 隔离数据范围防止权限越权放大，写操作限制仅可编辑字段。
6. **全套自动化测试**：27 个单元测试用例 + PostgreSQL 17 实库集成测试全部通过。
7. **多智能体 Review**：派发独立 Reviewer 子智能体进行了两轮严密代码审计，所有 P1/P2 隐患全部清零并取得 PASS 裁决。

## 门禁验证证据

- `pnpm --filter @base/authorization test`：27/27 PASS
- `pnpm test`：39/39 PASS
- `pnpm --filter @base/authorization test:integration`：1/1 PASS
- `pnpm check`：8/8 packages PASS
- `./scripts/verify.sh`：PASS
- `./init.sh`：PASS
- Reviewer 独立审计：PASS / Merge verdict OK

## 遗留风险与下一特性

- 本特性保持纯粹底座定位，不依赖具体采购数据模型。
- 下一特性为 `foundation-migration`（多租户数据库迁移引擎）。
