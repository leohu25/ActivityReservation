# @chenrun/ui

辰润 ERP 的工业风 UI 体系。分三层：

| 层 | 目录 | 职责 |
|----|------|------|
| **shadcn** | `src/components/shadcn/` | 仅 `npx shadcn@latest add` 引入（含复杂组件）；禁止手写 |
| **组件层** | `composite/`、`layout/`、`feedback/` | 业务无关组合（DataTable 零件、Auth、TagMultiSelect…） |
| **模板层** | `templates/` | 可选加速：Workspace / PageShell / DashboardShell |

## 使用约定（优先简单）

1. **能直接用 shadcn 就直接用**（Form / Table / Dialog / Select / Checkbox / Label / Card…）
2. 列表需要统一工具栏时，再用 `DataTable.Workspace`
3. 长表单 / AI 批量字段可用 `FormFields` Schema
4. 非列表页（设置 / 字典 / 树）页头 + 反馈条统一用 `PageShell`，禁止各 View 手写 h1 与 emerald/rose 横幅
5. 权限：契约 action + `ActionButton` + Server `assertAbility`（逻辑不变）

## 常用入口

```ts
import {
  // shadcn 原子
  Button, Input, Select, Checkbox, Label, Table, Dialog, Card,
  // 组件层
  DataTable, FeedbackBanner, TagMultiSelect, AuthorizedField,
  // 模板层（可选加速）
  PageShell, DashboardShell, DataTable.Workspace,
  // hooks / utils
  useSafeRouter, useListUrlNav, toast,
} from "@chenrun/ui";
```

### 分层选用指引

| 场景 | 推荐 |
|------|------|
| 简单表单 / 设置面板 | `PageShell` + shadcn `Form` 零件（Input/Select/Checkbox/Label/Card） |
| 字典 / 分类卡片 | `DictionarySectionCard`（已封装搜索过滤）或 `PageShell` + Card |
| 列表页（工具栏+筛选+分页） | `DataTable.Workspace` |
| 新建/编辑弹窗 + Schema 字段 | `DataTable.FormModal` + `FormFields` |
| 权限字段三态 | `AuthorizedField` / `DataTable.AuthorizedField`（勿绕过） |
| 权限按钮 | `DataTable.ActionButton`（勿手写 can 判断散落各处） |

## 新增 shadcn 组件

```bash
cd packages/ui
npx shadcn@latest add <component> --yes
# 如生成 @/ 别名 import，改为相对路径 ../../shadcn/xxx
# 新组件记得在 src/components/shadcn/index.ts 挂导出
```
