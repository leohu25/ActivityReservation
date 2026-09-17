# 特性范围说明 — arch-ui-base-ui-full-migration

## 修改白名单

- `feature_list.json`
- `member.local.md`
- `.harness/features/arch-ui-base-ui-full-migration/**`
- `packages/base/ui/**`
- `apps/control/**`
- `apps/tenant/**`
- `packages/platform/**`
- `packages/domains/**`
- `package.json`
- `pnpm-lock.yaml`
- `pnpm-workspace.yaml`
- `docs/**`

### @ 004cd182 联动修改自动登记

- `tsconfig.base.json`

## 范围约束

- 仅允许与 shadcn Radix → Base UI 迁移、调用点适配、对应测试修复直接相关的修改。
- 禁止修改数据库 Schema、迁移账本、认证授权业务规则与领域业务语义。
- 禁止借迁移之机升级 Next.js、Prisma、TypeScript、ESLint 等无关技术栈。
- 原子层保持官方 shadcn Base UI 结构；项目扩展放置于 Composite 或 Templates 层。

## 受保护区域

- 不改变 CASL 权限动作和 Subject 契约。
- 不改变多租户路由和数据隔离逻辑。
- 不改变 Server Action、Query 与序列化协议。
- 未经用户审阅确认不得提交代码。
