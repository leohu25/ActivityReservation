# 专属验证证据：授权核心与能力构建器 (foundation-authorization)

| 检查项 | 命令 | 结果 |
| :--- | :--- | :--- |
| PostgreSQL 容器 | `docker compose up -d --wait saas-control-postgres` | PASS，PostgreSQL 17 healthy |
| Prisma Schema | `pnpm --filter @base/db-control prisma:validate` | PASS |
| Prisma Client | `pnpm --filter @base/db-control generate` | PASS，7.10.0 |
| 实库 Schema | `pnpm --filter @base/db-control db:push` | PASS，in sync |
| Auth 回归 | `pnpm --filter @base/auth test` | PASS，10/10 |
| Authorization 单测 | `pnpm --filter @base/authorization test` | PASS，7/7 |
| Control DB 单测 | `pnpm --filter @base/db-control test` | PASS，4/4 |
| Dynamic Role 实库集成 | `pnpm --filter @base/authorization test:integration` | PASS，1/1 |
| Catalog 编译期契约 | `pnpm check`（含 `catalog.type-contract.tsx`） | PASS，合法常量可编译，未知 action/subject 的 `@ts-expect-error` 紧邻 JSX attribute 并被实际消费 |
| 全仓类型检查 | `pnpm check` | PASS，8/8 |
| Next.js 构建 | `pnpm build` | PASS |
| 全栈门禁 | `./scripts/verify.sh` | PASS，29 个变更合规、33 个源码无红线 |
| 可重启自检 | `./init.sh` | PASS |
| 数据清理 | PostgreSQL count query | PASS，`0 | 0 | 0 | 0` |
| Diff / staging | `git diff --check` / `git diff --cached --name-only` | PASS / NO STAGED FILES |

## 安全断言

1. Ability 只接受可信 `TenantContext`，并重新校验 Organization + User + Member。
2. OrganizationRole 查询绑定 active Organization；跨组织返回、坏 JSON、未知资源/动作均 fail-closed。
3. 动态多角色权限取并集；未知角色默认无权限。
4. Better Auth owner/admin 的应用权限通过静态 role statement 编译，member 默认无应用权限。
5. Authorization 实库测试使用包内权限 fixture，不反向导入采购业务 Feature；生产采购组合由应用 composition root 的 build/typecheck 验证。
6. 未导出可自行扩大 string 泛型的守卫；`createServerAbilityAdapter(catalog)` 通过闭包与 `NoInfer` 绑定 action/subject union，`AuthorizedInvocation` 携带同一具体 Ability，并由 CASL `ForbiddenError` 判断。
7. 未导出未绑定 Permission/Can；`createReactAbilityAdapter(catalog)` 返回 catalog-bound 组件并共享 `@casl/react` AbilityProvider。
8. 未实现 Conditions、Fields 或 Prisma 数据范围下推。
