# 架构背景与决策上下文 — feat-customer-center-official-crud-refactor

## 1. 背景与核心痛点

1. **状态双写**：`CustomerView` 使用 `useState` 镜像 `initialCustomers/page/total`，并用 `useEffect` 与 URL/props 同步，AI 极易写出死循环。
2. **URL 契约缺失**：`page.tsx` 手写 `readOne/readInt`，与 Client 筛选状态两套逻辑。
3. **刷新编排分散**：历史实现客户端 `router.refresh()` 与服务端职责混杂。
4. **表单易错**：若业务层手写 Dialog+Input，字段校验/三态/CASL 权限重复实现；正确做法是 **`FormModal` 强类型契约**（仓库现状已基本如此，需固化为标杆并禁止回退）。
5. **文档漂移**：目标架构文档曾误写 RHF 手写 Field；harness 仍引用已作废的 `useTableUrlState` / `parseTableSearchParams`。

## 2. 演进目标（以目标架构 v2.1 为准）

以 `@base/feature-customer-center` 为唯一 0→1 标杆，固化：

| 层 | 标准 |
| :--- | :--- |
| URL | **nuqs** `search-params.ts` + `createSearchParamsCache`；Client `useQueryStates` |
| 列表 UI | **`DataTable`** 纯受控 + nuqs（Element-UI 式列配置） |
| 弹窗 UI | **`FormModal` + Zod + `FormFieldSchema`/`sections` + `subject`**（Element-UI 式表单契约） |
| 服务端读 | `server-only` Query + DTO 投影 + `Promise.all` + React `cache()` 上下文 |
| 服务端写 | `defineServerAction` + Zod + `assertEditableFields` + `revalidatePath` |
| 发号 | DB sequence / 稳定 ID，**禁止** `count()+1` |
| 性能 | 对照 `.agents/skills/vercel-react-best-practices`（P1c） |
| 质量 | 以架构文档「质量门禁」验收，**不再以 300 行 KPI 卡刀** |

## 3. 预期成效

- 消除 Client 数据镜像与手写 searchParams 解析。
- 新 CRUD 切片可按 6 阶段流水线机械化复制。
- Table/Form 使用体验接近 Element UI：只传契约与数据，不拼控件树。
- Vibe Coding 可执行：事实源 P0 AGENTS → P1 目标架构 → P1c Vercel skill。

## 4. 明确作废（禁止再写入实现）

- `useTableUrlState` / `parseTableSearchParams` / 私有 search DSL
- 业务层直接 `react-hook-form` + 手写 `FieldGroup` 表单树
- 业务层手写 `<table>` 或第二套表格引擎
