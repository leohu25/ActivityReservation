# 特性交接备忘录 (Handoff) — ui-datatable-pipeline-and-dx-governance

## 1. 交付摘要

本特性系统性解决了企业级 DataTable 状态管理脆弱、业务切片搜索瘫痪、外键编码与中文名称搜索脱节、占位符错乱以及权限黑盒失踪痛点，交付了开箱即用的标准搜索契约体系（SearchContract）、通用状态流水线 Hook（useDataTableState）、回车自动查询以及架构红线强门禁拦截。

## 2. 核心成果

1. **统一搜索契约体系 (SearchContract - 关联穿透 SSoT)**：
   - 在 `@base/shared` 封装 `SearchContract` 契约规范与 `sanitizeSearchKeyword` 核心防注入清洗函数；
   - 封装 `executeSearchContract` 服务端执行引擎，内置并发反查关联外键、去重与 `take: 100` 熔断防护；
   - `@base/ui` 的 `DataTable` 原生接入 `searchContract`，输入框占位符依据契约全自动生成，零手动配置；
   - 销售订单切片落地 `salesOrderSearchContract`，彻底修复了“搜索客户名称‘李四’、门店名称无法命中订单”的历史恶性体验，并编写自动化单测。
2. **底层组件与通用 Hook 沉淀 (`@base/ui`)**：
   - 封装导出 `useDataTableState`：接管受控 `page`, `pageSize`, `total`, `keyword`, `onSearch`, `onReset`, `onPageChange`，与 `useListUrlNav` 双向无缝同步，杜绝漏传参数；
   - `DataTable` 搜索框原生支持 Enter 键回车查询；
   - 废除硬编码的“单号”占位符，升级为中立语义默认值；
   - `DataTableActionButton` 在未授权置灰提示模式下，支持精准展示 `当前角色缺少 [action:subject] 权限`，消除黑盒。
3. **存量业务切片彻底治理**：
   - 修复 `CustomerView`（客户档案）漏传 `keyword` 参数导致的搜索失效 Bug，修正占位符为 `输入客户编码 / 客户名称 / 联系人...`；
   - 修复 `StoreView`（门店管理）漏传 `keyword` 与 `customer` 参数导致的搜索失效 Bug，修正占位符为 `输入门店编码 / 门店名称 / 地址...`；
   - 修复 `QuoteView`（报价单）的查询状态同步逻辑。
4. **架构红线静态强门禁与规范沉淀**：
   - `scripts/check/check-redlines.mjs`：增加规则 9，在业务单据中严禁对外键编码直接使用 `contains` 文本偷懒匹配；
   - `scripts/check/check-ui-permission-guards.mjs`：增加规则 C，严禁 DataTable `onSearch` 漏传 `keyword` 参数；
   - 全面更新 `.agents/skills/next-saas-base-dev/` 核心开发规范（§1.1 SearchContract 体系与 §2.0 状态流水线）。
5. **组织架构角色管理完整闭环**：
   - 挂载 `/organization/roles` 独立路由，具备完整 CRUD 能力与服务端分页；
   - 权限配置中心 `/settings/roles` 左侧收敛为纯粹角色选择器，与长表格形成高密度吸顶协同。

## 3. 后续维护指南

后续开发任何新的 `DataTable` 业务列表页面时：

1. **定义搜索能力**：优先在切片的 `contract.ts` 中声明 `searchContract`；
2. **前端绑定**：将 `searchContract` 传给 `<DataTable searchContract={...} />`，由框架自动生成输入框语义占位符；
3. **后端执行**：Service 中直接调用 `executeSearchContract` 构造 `where.OR`，严禁在业务单据中直接对外键编码手写 `contains`。
