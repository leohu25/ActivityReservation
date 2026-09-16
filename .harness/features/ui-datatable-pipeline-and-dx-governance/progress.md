# 特性推进看板 (Progress) — ui-datatable-pipeline-and-dx-governance

## 一、 任务分解与推进状态

- [x] **任务 1：建立 Feature 与 Harness 沙盒规范文档**
  - [x] 在 `feature_list.json` 中追加 `ui-datatable-pipeline-and-dx-governance` 特性登记；
  - [x] 在 `.harness/features/ui-datatable-pipeline-and-dx-governance/` 下建立完整 5 个标准沙盒文档（context, scope, progress, verification, handoff）。
- [x] **任务 2：底层加固：DataTable 交互强化与 useDataTableState 提效 Hook**
  - [x] 在 `packages/base/ui/src/lib/use-data-table-state.ts` 封装通用状态流水线 Hook；
  - [x] 在 `packages/base/ui/src/components/templates/DataTable.tsx` 补齐回车键监听 `onKeyDown` 自动触发 `onSearch`；
  - [x] 优化 `keywordPlaceholder` 默认值，移除生硬的“单号”字样，提供高内聚通用推导；
  - [x] 编写 `use-data-table-state.test.tsx` 单元测试并通过。
- [x] **任务 3：业务切片治理：彻底修复客户中心等切片搜索失效与文案混乱**
  - [x] 修复 `CustomerView.tsx` 漏传 `keyword` 参数问题与占位符错乱；
  - [x] 修复 `StoreView.tsx` 漏传 `keyword` 与 `customer` 筛选条件；
  - [x] 修复 `QuoteView.tsx` 漏传 `keyword` 问题；
  - [x] 检查并确保各列表 URL 与服务端 RSC 刷新无缝打通。
- [x] **任务 4：权限调试与体验增强：无权限友好置灰提示机制**
  - [x] 优化 `DataTableActionButton` 和 `DataTableRowActions`，支持更友好的未授权原因提示（指示缺失的具体权限）；
  - [x] 确保不破坏既有的生产环境安全隔离。
- [x] **任务 5：全栈搜索契约体系 (SearchContract) 研发与“开箱即用”闭环**
  - [x] 在 `@base/shared` 定义 `SearchContract` 契约规范与 `sanitizeSearchKeyword` 核心防注入清洗函数；
  - [x] 在 `@base/shared` 封装 `executeSearchContract` 服务端穿透执行引擎，自带并发反查、去重与熔断，编写 18 项单测；
  - [x] 在 `@base/ui` 的 `DataTable` 接入 `searchContract`，输入框占位符根据契约全自动生成，零手动配置；
  - [x] 在 `order-center` 切片定义 `salesOrderSearchContract`，重构 `SalesOrderView` 与 `service.ts`，彻底解决“搜李四搜不到订单”的恶性体验；
  - [x] 编写销售订单针对客户名称穿透搜索的自动化单元测试（25/25 通过）。
- [x] **任务 6：架构红线门禁强硬拦截与 Skill 全栈规范同步**
  - [x] 在 `scripts/check/check-redlines.mjs` 中增加针对在业务单据中直接对 `customerCode/storeCode` 写 `contains` 偷懒代码的静态硬拦截；
  - [x] 在 `scripts/check/check-ui-permission-guards.mjs` 增加针对 DataTable `onSearch` 漏传 `keyword` 模式的静态拦截与双向单测；
  - [x] 同步更新 `.agents/skills/next-saas-base-dev/references/1-contracts.md`（§1.1 SearchContract 体系）与 `5-ui-components.md`（§2.0 状态流水线与防漏传黄金法则）。
- [x] **任务 7：全栈门禁验证与交接归档**
  - [x] 运行 `@base/shared`, `@base/ui`, `@base/feature-customer-center`, `@base/feature-order-center`, `@base/feature-tenant-admin` 单元测试，确保 100% 通过；
  - [x] 运行 `pnpm check`（`tsc --noEmit`），确保 0 错误；
  - [x] 运行 `check-redlines.mjs` 与 `check-ui-permission-guards.mjs` 门禁，全绿通过；
  - [x] 完善沙盒 `progress.md`, `verification.md` 与 `handoff.md`。
