# 特性范围与边界声明 (Scope) — ui-datatable-pipeline-and-dx-governance

## 一、 纳入范围 (In Scope)

1. **基础组件与 Hook 沉淀 (`packages/base/ui/`)**：
   - 封装导出 `useDataTableState` 通用 Hook（支持 `initialPage`, `initialPageSize`, `initialKeyword`, `onSearch`, `onReset`, `onPageChange`，自动绑定 URL 路由同步）；
   - 在 `DataTable.tsx` 搜索 `Input` 上挂载 `onKeyDown={(e) => { if (e.key === 'Enter') onSearch?.(); }}`；
   - 改造 `keywordPlaceholder` 默认值，移除生硬的“单号”字样，改为中立通用的 `"输入关键字搜索..."`，并支持语义化推导；
   - 在 `DataTableActionButton` / `DataTableRowActions` 中加固未授权调试友好策略（支持置灰 + Tooltip 说明缺失权限）。

2. **业务切片修复与对齐 (`packages/domains/customer-center/` 等)**：
   - `CustomerView.tsx`：修复 `onSearch` 漏传 `keyword` 参数的严重 Bug；修复 `keywordPlaceholder` 为 `"输入客户编码 / 客户名称 / 联系人..."`；
   - `StoreView.tsx`：修复 `onSearch` 漏传 `keyword` 与 `customer` 的 Bug；修复 `keywordPlaceholder` 为 `"输入门店编码 / 门店名称 / 地址..."`；
   - `QuoteView.tsx`：修复 `onSearch` 漏传 `keyword` 的 Bug；修复 `keywordPlaceholder` 为 `"输入报价单号 / 客户名称..."`。

3. **单元测试与门禁验证**：
   - 为 `useDataTableState` 补齐自动化单元测试；
   - 为 `DataTable` 的 Enter 搜索与状态下推补齐单测验证；
   - 全仓运行 `pnpm check` 与 `pnpm test` 保证 100% 绿灯。

## 二、 严禁范围 (Out of Scope)

- 严禁修改已稳定的底层 CASL 授权引擎的核心计算逻辑（`CaslAbilityFactory`）；
- 严禁变更生产环境物理数据库迁移 Schema；
- 严禁对其他未受影响的业务切片做跨范围大改。
