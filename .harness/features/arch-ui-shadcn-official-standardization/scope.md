# 特性范围说明 — arch-ui-shadcn-official-standardization

## 修改白名单

- `feature_list.json`
- `member.local.md`
- `.harness/features/arch-ui-shadcn-official-standardization/**`
- `packages/base/ui/**`
- `scripts/**`
- `package.json`
- `pnpm-lock.yaml`
- `apps/control/**`
- `apps/tenant/**`
- `packages/platform/**`
- `packages/domains/**`
- `docs/**`

### @ fc2e49fb 联动修改自动登记

- `.prettierignore`
- `biome.json`
- `eslint.config.mjs`
- `tsconfig.base.json`

## 范围约束

- 聚焦于 `@base/ui` 向 shadcn UI 官方最佳实践（Monorepo Design System）的架构收敛与正名。
- 允许目录重命名：`src/components/shadcn/` -> `src/components/ui/`。
- 允许合流原子组件变体（`Badge`）与修复逻辑（`Select`），删除多余的 1:1 伪包装层。
- 允许清理废弃组件（`toast.tsx`）并统一通知事实源为 `sonner`。
- 禁止破坏外部业务切片对 `@base/ui` 的既有纯数据契约与公共组件 API。
- 禁止修改数据库 Schema、权限规则与服务端逻辑。

## 受保护区域

- CASL 权限规则与四层权限闭环。
- 业务领域模型与数据持久层。
- 未经用户审阅确认不得私自提交代码。
