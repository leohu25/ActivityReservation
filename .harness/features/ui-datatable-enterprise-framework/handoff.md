# 会话交接清单 (Handoff)

## 1. 特性元数据

- **Feature ID**: `ui-datatable-enterprise-framework`
- **Feature 名称**: 【UI组件体系】工业级通用列表积木框架升级与开发规范沉淀
- **状态**: 已完成 (completed)
- **前置依赖**: `foundation-day0-db-self-healing` (已达成)

## 2. 本会话交付摘要

1. **一体化列表积木**（`packages/ui/src/components/composite/data-table/`）：
   - `DataTable.Root` 默认 `integratedCard` 白卡；列显隐状态（`visibleColumnIds/toggle/reset`）
   - 新增 `Header` / `FilterBar` / `InputGroup` / `ColumnSettings` / `FormSection` / `FormFieldGrid` / `FormBanner`
   - `Content` 支持 `showIndex` 跨页序号与列设置联动
   - `Pagination` 支持范围文案与数字页码
   - `RowActions` 默认平铺「详情/编辑」+ 折叠菜单
   - `FormModal` / `DetailDrawer` 对齐参考高保真居中弹窗（无色带、无步骤条）
2. **技能沉淀**：`.agents/skills/erp-feature-dev/references/5-ui-components.md` 重写 DataTable 手册
3. **验证**：ui 包 27/27 单测、全仓 13 包 check 全绿

## 3. 下一会话启动指引

1. 业务页面可按 `references/5-ui-components.md` §2 范式装配 DataTable。
2. 需要侧边高级筛选时继续使用 `DataTable.FilterDrawer`（Sheet 形态保留）。
3. 组件导出命名空间：`DataTable.Header/FilterBar/InputGroup/ColumnSettings/FormModal/DetailDrawer/...`。
