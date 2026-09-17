# 特性推进看板 (Progress) — arch-eliminate-search-dsl-and-adopt-prisma-native-relations

## 一、 任务分解与推进状态

- [x] **任务 1：建立 Feature 与 Harness 沙盒规范文档**
  - [x] 在 `feature_list.json` 中追加 `arch-eliminate-search-dsl-and-adopt-prisma-native-relations` 特性登记；
  - [x] 在 `.harness/features/arch-eliminate-search-dsl-and-adopt-prisma-native-relations/` 下建立完整标准沙盒文档。
- [x] **任务 2：配置逻辑外键与更新 Tenant Prisma Client**
  - [x] 在全仓各业务切片与 `packages/base/db-tenant` 的 Prisma Schema 配置 `relationMode = "prisma"`；
  - [x] 补齐 `@relation` 显式操作约束 `onDelete: Restrict, onUpdate: Restrict`（针对树状自引用与常规外键关系）；
  - [x] 在 `SalesOrder` 模型中声明对 `Customer` 和 `CustomerStore` 的纯逻辑 `@relation`；
  - [x] 运行 `node scripts/sync/sync-tenant-schema.mjs` 聚合 Canonical Schema；
  - [x] 运行 `pnpm db:migrate:generate` 生成无物理外键且执行全库 29 个存量物理外键 DROP 的纯洁迁移 `20260917020253_drop_all_foreign_keys_and_use_logical_relations`；
  - [x] 运行 `pnpm --filter @base/db-tenant generate` 重新生成纯逻辑强类型的 `TenantPrismaClient`。
- [x] **任务 3：业务切片全面迁移至 Prisma 原生搜索范式 A**
  - [x] `order-center`：移除 `salesOrderSearchContract`，`listSalesOrders` 切换为 Prisma 原生 `customer: { customerName: ... }` 嵌套关系过滤，更新单测（25/25 PASS）；
  - [x] `customer-center`：移除 `customerSearchContract` 与 `storeSearchContract`，直接使用强类型 Where 组装（42/42 PASS）；
  - [x] `procurement-center` 与 `material-center`：移除废弃的 `SearchContract` 契约，切换为标准 `keywordPlaceholder`（19/19 & 12/12 PASS）；
  - [x] `tenant-admin`：移除 `departmentSearchContract` 与 `roleSearchContract`（24/24 PASS）。
- [x] **任务 4：物理删除私有 DSL 与门禁脚本净化**
  - [x] 物理删除 `packages/base/shared/src/utils/query/keyword-search-engine.ts`；
  - [x] 简化 `keyword-search.ts`，仅保留纯字符串 `sanitizeSearchKeyword` 防注入清洗工具；
  - [x] 净化 `scripts/check/check-redlines.mjs`，废除强制要求 `executeSearchContract` 的旧规则；
  - [x] 净化 `DataTable.tsx`，移除 `searchContract` 属性，统一使用标准的 `searchPlaceholder` / `keywordPlaceholder`；
  - [x] 更新 `.agents/skills/next-saas-base-dev/references/1-contracts.md` 规范。
- [x] **任务 5：全仓验证与交接确认**
  - [x] 全仓类型检查 `pnpm check`（18 个任务全绿，0 错误）；
  - [x] 全量单元测试 `pnpm test`（16 个包全部 PASS，0 失败）；
  - [x] 全栈架构红线、切片规范、UI 权限受控门禁验证全部通过；
  - [x] 呈报完整清单等待确认提交。
