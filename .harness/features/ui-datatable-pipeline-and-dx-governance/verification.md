# 特性验证报告 (Verification) — ui-datatable-pipeline-and-dx-governance

## 1. 验证目标与达成证据

- **验证目标 1：`useDataTableState` 核心 Hook 状态流转与双向同步**：
  - 在 `packages/base/ui/src/lib/use-data-table-state.ts` 中封装导出；
  - 编写 `packages/base/ui/src/lib/use-data-table-state.test.tsx` 单元测试，测试用例全部 PASS；
  - 验证初始参数派生、`bindProps` 解构展开、URL 参数自动同步与手动控制完全符合预期。
- **验证目标 2：`DataTable` 交互增强与 Enter 回车原生监听**：
  - 搜索框 `<Input>` 绑定 `onKeyDown={(e) => { if (e.key === 'Enter') onSearch?.(); }}`；
  - 全局移除粗暴的硬编码 `"单号 / 名称 / 关键字"`，统一升级为通用的 `"输入关键字搜索..."`。
- **验证目标 3：业务切片漏传 keyword 导致搜索失效的彻底修复**：
  - `CustomerView.tsx`：`onSearch` 完整传参 `keyword: keyword.trim() || undefined, category, status`，修复点击查询无反应的问题；占位符升级为 `"输入客户编码 / 客户名称 / 联系人..."`；
  - `StoreView.tsx`：`onSearch` 完整传参 `keyword, customer, status`；占位符升级为 `"输入门店编码 / 门店名称 / 地址..."`；
  - `QuoteView.tsx`：`onSearch` 与 `onReset` 统一带入当前完整状态与分页参数。
- **验证目标 4：权限开发体验与置灰提示加固**：
  - `DataTableActionButton` 在未授权状态下，若选择置灰模式（或配置说明），Tooltip 会精准指示具体缺失的权限原因（如 `"当前角色缺少 [create:Role] 权限"`），杜绝排查黑盒。
- **验证目标 5：开箱即用的 SearchContract 搜索契约体系与防注入穿透检索**：
  - 在 `@base/shared` 建立 `SearchContract` 规范与 `executeSearchContract` 服务端执行引擎；
  - 接入不可见控制字符清洗与长度截断，底层全参数化 Prepared Statement，物理彻底阻断 SQL 注入；
  - `@base/ui` 的 `DataTable` 接入 `searchContract`，输入框占位符根据契约定义全自动生成（如 `输入 订单号 / 销售员 / 客户 / 门店...`），零手动配置；
  - `order-center` 切片全面接入，后端 1 行代码执行穿透反查，前端 1 行绑定契约，并编写“搜索客户名称‘李四’成功返回订单”的自动化单元测试（PASS）。
- **验证目标 6：静态红线与代码规范硬拦截守卫**：
  - `scripts/check/check-redlines.mjs`：增加规则 9，在业务单据中严禁对外键编码直接使用 `contains` 文本偷懒匹配；
  - `scripts/check/check-ui-permission-guards.mjs`：增加规则 C，严禁 DataTable `onSearch` 漏传 `keyword` 参数；
  - 529 个全量源码文件扫描通过，并编写了双向断言单测。
- **验证目标 7：全仓测试与应用编译 100% 绿灯**：
  - `@base/shared` 测试 18/18 全部通过；
  - `@base/ui` 测试 13/13 全部通过；
  - `@base/feature-order-center` 测试 25/25 全部通过；
  - `@base/feature-customer-center` 测试 42/42 全部通过；
  - `@base/feature-tenant-admin` 测试 24/24 全部通过；
  - `pnpm --filter tenant check`（`tsc --noEmit`）0 错误；
  - 架构红线扫描门禁全绿通过。
