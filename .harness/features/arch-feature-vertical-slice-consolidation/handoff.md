# 交接文档

## 完成内容

- Customer Center 定位为 Business Area / Feature Group，内部按 Customer Management、Store Management、Quotation Management Feature 与 Classification Sub-Feature 垂直内聚。
- Contract、Types、Service、Query、mutation Action、UI 与测试完成就近归位；未引入过度设计或机械 DDD 分层。
- 解决架构审查问题：将底层租户 DB 上下文 (`shared/server/tenant-context.ts`) 与业务区域装配 (`assembly/context.ts`) 明确分层，彻底解除 `shared/server` 对 `features/` 契约的反向依赖。
- Tenant Admin 业务垂直切片化重构：
  1. 彻底解体 `tenant-admin` 的原技术层平铺（components/services/contracts 等），在 `src/features/` 下内聚建立 `org-management`、`role-management`、`tenant-settings`、`workbench`、`audit-log`。
  2. 每个切片内部自闭环包含 `contract.ts`、`types.ts`、`service.ts`、`queries.ts`、`actions.ts`、`ui/`、`public.ts`、`public.server.ts`。
  3. 服务文件统一命名为 `service.ts`，内置角色枚举 `BUILT_IN_ROLES` 下沉至 `@chenrun/authorization`。
  4. 更新 `package.json#exports` 语义子路径，外部调用方（`apps/tenant`）原子切换并落实读写分离。
- 工程工具治理与门禁升级：
  1. 将 `scripts/` 目录按单一职责拆分为 `check/`、`sync/`、`reporter/`、`tools/`，彻底物理清理根目录所有空壳胶水文件，全仓 11 个包调用索引同步更新。
  2. 新增业务垂直切片架构完整性自动化门禁 `check-vertical-slices.mjs` 并接入 `scripts/verify.sh`。
  3. 登记并初始化新特性沙盒 `arch-data-scope-and-base-entity-audit`。

## 验证证据

- `pnpm --filter @chenrun/feature-customer-center check`
- `pnpm --filter @chenrun/feature-customer-center test`
- `pnpm --filter @chenrun/feature-tenant-admin check`
- `pnpm --filter @chenrun/feature-tenant-admin test`
- `pnpm --filter tenant check`
- `node scripts/check/check-redlines.mjs`
- `node scripts/check/check-vertical-slices.mjs`
- `node --test scripts/check/check-redlines.test.mjs scripts/check/check-vertical-slices.test.mjs`
- `./scripts/verify.sh`
- `pnpm test`
- `pnpm run check`
