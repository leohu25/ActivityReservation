# 特性验收标准与证据 (Verification) — arch-domain-platform-layering-refactor

## 验收结果与证据 (Evidence)

1. **架构全景三层分层治理 100% 落地**：
   - 建立 `packages/base/` 跨领域底层公共基础设施，将 `auth`, `authorization`, `biz-shared`, `db-control`, `db-tenant`, `shared`, `ui` 7 个底层模块全部物理归位；
   - 建立 `packages/platform/` 平台级系统套件，将 `control-admin` 与 `tenant-admin` 完整归位；
   - 建立 `packages/domains/` 垂直业务领域切片，将 `customer-center`, `material-center`, `order-center`, `procurement-center` 完整归位；
   - 彻底废除并物理清除了旧的 `packages/features/` 目录以及根级裸露的基础设施包，达成极致纯净的 3 层拓扑（`packages/base/*`, `packages/platform/*`, `packages/domains/*`）。

2. **工作区依赖拓扑与工程配置全链路对齐**：
   - 更新 `pnpm-workspace.yaml` 为严谨明确的 `packages/base/*`, `packages/platform/*`, `packages/domains/*`，删除模糊通配；
   - 更新 `tsconfig.base.json`，将 `@base/*` 的所有 path aliases 精准指向 `packages/base/*`；
   - 更新 `turbo.json` 的 `//#codegen` 任务路径与监听边界；
   - 更新 `apps/control/Dockerfile` 与 `apps/tenant/Dockerfile` 的容器构建分发路径；
   - 更新 `package.json` 中的 `ui:add` 路径指向 `packages/base/ui`；
   - 更新 `tooling/db-migrate/src/schema/aggregate.ts`，自动从 `packages/base/db-*` 汇聚 Canonical Schema；
   - 更新 `eslint-boundaries.mjs`，在 ESLint 层对 `packages/base/*` 建立强类型分层单向流防御。

3. **彻底清除门禁与治理工具的历史硬编码与免死金牌**：
   - `scripts/check/check-vertical-slices.mjs` 纯化为专门校验 `packages/domains/*` 业务领域切片的强规则，彻底清除了 `NON_TENANT_FEATURE_PACKAGES = new Set(["control-admin"])` 静态硬编码；
   - `scripts/check/check-redlines.mjs` 与 `scripts/check/check-entity-baseline.mjs` 适配新的 `packages/base/*` 路径；
   - `scripts/sync/sync-features.mjs` 与 `scripts/sync/sync-tenant-schema.mjs` 动态发现并聚合各层资产。

4. **全栈质量与自动化门禁验证**：
   - `pnpm check`（16 packages）18/18 任务全部 100% 绿灯；
   - `pnpm test`（16 packages）16/16 任务全部 100% 绿灯（数百个自动化单测全 PASS）；
   - `pnpm lint`（16 packages）16/16 任务全部 100% 绿灯（0 error）；
   - `node scripts/verify.mjs` 9 项物理门禁自检全部一次性通过。
