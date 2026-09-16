# 特性设计与上下文 (Context) — ui-datatable-pipeline-and-dx-governance

## 1. 特性背景与痛点根因

在经历前序从朴素前端到 SSoT CASL 四维权限契约以及 UI 三层架构（shadcn/ -> composite/ -> templates/）的重构后，系统底层架构已高度规范。然而在各业务领域切片消费 `@base/ui` 的 `DataTable` 模板时，存在以下结构性缺陷与开发痛点：

1. **业务切片搜索功能瘫痪 (漏传 keyword)**：
   - 客户管理（`CustomerView`）、门店管理（`StoreView`）、报价管理（`QuoteView`）等列表在实现搜索逻辑时，手写的 `onSearch` 仅调用了 `navigateList({ page: 1 })`，漏传了当前输入的 `keyword` 参数；
   - 导致点击“查询”按钮后，URL 查询参数未带入关键字，RSC 重新查询得到原数据集，视觉上表现为“搜索完全无效”。
2. **预置占位文本粗糙且错位**：
   - `@base/ui/DataTable` 全局默认 `keywordPlaceholder = "单号 / 名称 / 关键字"`；
   - 业务切片未传或盲目复制，导致在客户档案等无“单号”实体的页面上赫然出现“单号 / 名称 / 联系人”，严重违背工业级 ERP 业务真实语义。
3. **输入框缺乏回车（Enter）查询直觉交互**：
   - `DataTable` 内部的搜索 `Input` 仅绑定了 `onChange`，未监听 `onKeyDown`；用户按 Enter 键无法触发查询，严重影响高频录入体验。
4. **状态流水线未沉淀，业务胶水代码过多**：
   - 每个业务列表都在机械重复声明 `useState(page)`, `useState(pageSize)`, `useState(keyword)`, `navigateList(...)`，容易手抖出错，缺乏高内聚的状态 Hook。
5. **权限判定黑盒导致按钮神秘失踪**：
   - `DataTableActionButton` 和 `DataTableRowActions` 严格遵循 Fail-Closed，当权限未注入时直接从 DOM 抹除，开发者难以排查是代码丢失还是权限配置缺失。

## 2. 核心架构设计与重构目标

1. **沉淀 `useDataTableState` 通用 Hook**：
   - 统一接管列表受控状态（`page`, `pageSize`, `total`, `keyword`, `onSearch`, `onReset`, `onPageChange` 以及与 `useListUrlNav` 的 URL 自动双向同步）；
   - 提供直接展开到 `<DataTable {...table.bindProps} />` 的标准插槽接口，消除业务层 80% 的胶水代码并彻底杜绝漏传参数。
2. **强化 `DataTable` 底层交互与语义化占位符**：
   - 在搜索框上原生挂载回车键（Enter）自动触发 `onSearch`；
   - 彻底移除硬编码的 `"单号 / 名称 / 关键字"`，支持智能推导或干净优雅的默认提示。
3. **全面治理存量业务切片**：
   - 重点修复 `CustomerView`、`StoreView`、`QuoteView` 等列表的搜索联动与文案；
4. **增强权限防御与开发调试体验**：
   - 支持未授权友好置灰与 Tooltip 解释。
