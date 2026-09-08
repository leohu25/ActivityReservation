# 会话换手交接单：授权核心与能力构建器 (foundation-authorization)

- **状态**：实现与全栈门禁完成，等待 Coordinator/Reviewer 最终验收
- **分支**：`main`
- **日期**：2026-09-08

## 关键产出

- Feature-owned 采购 Resource -> Actions 定义与应用 composition root。
- Better Auth 默认 Organization statements/roles + Dynamic Access Control。
- Prisma `OrganizationRole` 持久化模型及按 Organization/Member roles 查询仓储。
- CASL Ability Factory：可信 Member 重验、逗号多角色、动态角色、多角色并集、owner/admin 静态应用权限、严格 catalog 校验，以及由 catalog 推导且无默认 string 泄漏的 AppAbility action/subject 类型。
- `createServerAbilityAdapter(catalog)` 通过闭包与 `NoInfer` 生成 catalog-bound ForbiddenError 守卫和 decorator-first `RequireAbility`，AuthorizedInvocation 绑定同一 Ability。
- `createReactAbilityAdapter(catalog)` 生成 catalog-bound Can/Permission，并共享 React 19 + `@casl/react` AbilityProvider。
- `catalog.type-contract.tsx` 将 `@ts-expect-error` 精确放置在报错 JSX attribute 上方，锁定未知 action/subject 编译失败且不存在 unused directive。
- PostgreSQL 17 实库以 authorization 包内权限 fixture 验证动态角色创建、跨组织同名角色隔离、Member buyer 角色与 CASL allow/deny，未反向依赖采购业务 Feature。

## 验证回执

- Prisma validate/generate/db push：PASS。
- Auth 10/10、Authorization 7/7、Control DB 4/4：PASS。
- PostgreSQL Dynamic Role 集成：1/1 PASS。
- `pnpm check`：8/8 PASS，含 catalog union 编译期负向契约。
- `pnpm build`、`./scripts/verify.sh`、`./init.sh`：PASS。
- 清理残留：`0|0|0|0`。
- `git diff --check`：PASS；NO STAGED FILES。

## 边界与后续

- 未提前实现数据 Conditions、字段权限或 `@casl/prisma`；下一特性为 `foundation-advanced-authz`。
- 本地 Schema 使用 `db:push` 验证；正式多租户迁移仍由后续 `foundation-migration` 实现。
- PostgreSQL 容器继续健康运行在 `127.0.0.1:55432`。
