# 会话换手交接单：权限体系统一排查与收敛重构 (arch-authz-consolidation)

## 一句话交接

权限契约派生 + shadcn 三层 UI（shadcn / composite / templates）已落地并提交 `ab326aa`；权限逻辑未削弱。

## 已完成（可直接依赖）

- 权限：Catalog `getDeclaredActions`、owner 单点、字段三态 `resolveFieldAccess`/`isFieldAllowedForAction`、customer 全量 Server CASL、`toggle_status`、ADR-007
- UI：`primitives` → `shadcn` 全量 CLI 组件；Workspace / FormSchema / FormModal / PageShell / FeedbackBanner / TagMultiSelect；CSV `exportContractCsv`；`useListUrlNav`
- 业务：客户中心列表+弹窗模板化；岗位/部门/新建角色 FormModal；General/Security 设置页 PageShell
- 死代码已删：MetricCard/ProcessStepper/ExceptionList/兼容 re-export
- 提交：`ab326aa`（pre-commit 门禁通过）

## 下一会话从哪开始

1. `git status` / `git log -1` 确认工作区干净（`?? .agents/skills/shadcn/` 为意外产物，**未提交**，可删或确认后入库）
2. 读 `packages/ui/README.md` + skill 红线 10–13
3. 建议下一批：
   - `CompanySettingsView` 套 PageShell 并回归 `AuthorizedField` 透传
   - `EmployeeView` / `CreateOrderDialog` / `AuditOrderModal` 弹窗 FormModal 化
   - 评估是否继续删 `DataTable.FilterDrawer/FacetedFilter` 等未用积木（测试有覆盖，勿盲删）

## 关键路径

- shadcn：`packages/ui/src/components/shadcn/`
- 模板：`packages/ui/src/components/templates/`
- 契约：`packages/features/customer-center/src/contracts/`
- 导出：`packages/shared/src/utils/export/`

## 禁止

- 禁止削弱契约 → ActionButton → Server CASL
- 禁止手写 primitives；只用 `shadcn add`
- 禁止未验证就大删 DataTable 权限积木
