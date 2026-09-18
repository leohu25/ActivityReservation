# 交接与会话记录 — feat-customer-center-official-crud-refactor

## 1. 范式状态：**已固化（客户档案标杆）**

新会话请按 **`references/9-crud-resource-paradigm.md`** 重构其他模块（Store / Quote / Role 等）。

**必读顺序**：

1. `AGENTS.md` 工程红线  
2. `.agents/skills/next-saas-base-dev/SKILL.md`（地图）  
3. `.agents/skills/next-saas-base-dev/references/9-crud-resource-paradigm.md`（标杆 SOP）  
4. `docs/architecture/refactoring-architecture-and-official-patterns.md`  
5. 标杆代码：`packages/domains/customer-center/src/features/customer-management/*`

## 2. 固化 API 速查

| 层 | 包 | API |
| :--- | :--- | :--- |
| 列表 URL | `@base/ui` | `defineListSearchParams` + `useListSearch` |
| 列表 UI | `@base/ui` | `DataTable` 默认 chrome + `filterExtra` |
| 表单 | `@base/ui` | `FormModal` + schema/fields + subject |
| Actions | `@base/biz-shared` | `createResourceActions`（`use server` 平铺 export） |
| Page | `@base/biz-shared` | `createResourcePage` |
| Action 包装 | `@base/shared` | `defineServerAction` + `toPlainData` |

**禁止**：`useTableUrlState` / `useDataTableState` / `useListUrlNav` / `bindProps` / 业务 RHF 手写表单 / ListShell / `count(*)+1` / 单开 `@base/crud`。

## 3. 下一步（新会话）

1. 按标杆迁 `StoreView` / `QuoteView` 等（DEBT-014）  
2. 迁完删除 `@deprecated` API  
3. 每步：更新 harness `progress.md` + `feature_list.json` evidence；**提交前人工审阅**

## 4. 本会话提交

见 git log：`feat(customer-center): 固化客户档案 CRUD 标杆范式并更新开发 Skill`。
