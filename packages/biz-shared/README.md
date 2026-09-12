# @base/biz-shared

通用 SaaS 跨业务切片（Cross-Feature Slices）通用业务中台公共资产库。

## 定位与职责边界

在大型 ERP 系统中，本包严格位于 **Level 2 业务中台层**：

```text
┌────────────────────────────────────────────────────────┐
│  packages/features/* (业务垂直切片，彼此物理隔离)       │
└───────────────────────────┬────────────────────────────┘
                            │ 依赖
                            ▼
┌────────────────────────────────────────────────────────┐
│  packages/biz-shared (跨切片业务中台，带有 ERP 领域属性)  │
└───────────────────────────┬────────────────────────────┘
                            │ 依赖
                            ▼
┌────────────────────────────────────────────────────────┐
│  packages/ui、packages/shared、packages/authorization   │
│  (纯技术底座，完全无业务语义)                          │
└────────────────────────────────────────────────────────┘
```

### 当前已落地内容 (Active)

- 跨单据通用的业务契约与状态机枚举 (`src/types/approval.ts`: `BizApprovalStatus`, `bizAuditActionSchema`)；
- ERP 业务流水号规约生成工具 (`src/utils/doc-no.ts`: `formatBusinessDocNo`)。

### 规划中待孵化资产 (Roadmap)

- 跨切片通用业务组件（如通用单据审批流弹窗 `AuditWorkflowModal`、动态物料明细行表格 `DocumentItemsTable`）；
- ERP 领域高级计算工具（如金额大写转换、发票税率联动核算）。

### 禁止事项

- 严禁反向依赖任何 `packages/features/*` 业务切片；
- 严禁存放与 ERP 业务无关的纯技术工具（应沉淀至 `@base/shared`）或纯 UI 原子组件（应沉淀至 `@base/ui`）。
