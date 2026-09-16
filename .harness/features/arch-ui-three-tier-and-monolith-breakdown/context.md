# 特性背景与目标 (Context) — arch-ui-three-tier-and-monolith-breakdown

## 任务目标

1. 规范 `@base/ui` 三层架构：
   - Level 1: 原子组件 (`packages/base/ui/src/components/shadcn/`)
   - Level 2: 复合组件与业务分子 (`packages/base/ui/src/components/composite/`)
   - Level 3: 场景模板 (`packages/base/ui/src/components/templates/`)，包括 `DashboardShell`, `PageShell`, `DataTable`, `FormModal`，并补齐沉淀 `MasterDetailShell`（主从/详情布局骨架，沉淀自客户、物料、采购的 Master-Detail 常见布局模式）。
2. 解构巨石视图与组件：
   - `packages/platform/tenant-admin/src/features/nav-management/ui/NavigationConfigView.tsx`（原约 1284 行），解构抽离为：
     - 独立受控节点编辑抽屉/模态框；
     - 菜单树操作工具栏与拖拽/排序控制器；
     - 预览视图与权限分配子组件。
   - `packages/domains/material-center/src/features/bom-management/ui/BomFlowEditorModal.tsx`（原约 1200 行），解构抽离为：
     - 工序节点流编辑器 (`BomStageFlow`)；
     - 投入产出物料配比表格 (`BomItemRatioTable`)；
     - 出成率与损耗率计算器子模块 (`BomYieldCalculator`)。
