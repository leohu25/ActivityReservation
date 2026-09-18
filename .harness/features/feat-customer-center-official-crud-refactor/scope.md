# 特性范围说明 — feat-customer-center-official-crud-refactor

> 权威目标架构：`docs/architecture/refactoring-architecture-and-official-patterns.md`（v2.1）  
> 性能 companion：`.agents/skills/vercel-react-best-practices/`  
> UI 项目契约：`DataTable` + `FormModal` + `FormFieldSchema`（对标 Element UI 声明式 DX）

## 修改白名单

- `feature_list.json`
- `.harness/features/feat-customer-center-official-crud-refactor/**`
- `docs/architecture/refactoring-architecture-and-official-patterns.md`（若需与实现回写对齐）
- `packages/domains/customer-center/**`
- `apps/tenant/src/app/(dashboard)/customer/**`
- `apps/tenant/src/app/layout.tsx`（注入 `<NuqsAdapter>`）
- `apps/tenant/package.json` / `packages/domains/customer-center/package.json`（引入 `nuqs`，`workspace:*` 依赖声明）
- `packages/base/ui/**`（**仅允许**增强 `DataTable` / `FormModal` / `FormFieldSchema` 通用契约；**禁止**新增 `useTableUrlState` / `parseTableSearchParams` 等与 nuqs 同质的私有轮子）


### @ 09835030 联动修改自动登记

- `packages/base/biz-shared/src/crud/actions.test.ts`
- `packages/base/biz-shared/tsconfig.json`
- `packages/base/ui/src/lib/list-search-params.test.ts`

- `packages/base/biz-shared/src/crud/actions.ts`
- `packages/base/biz-shared/src/crud/index.ts`
- `packages/base/biz-shared/src/crud/page.tsx`
- `packages/base/biz-shared/src/crud/types.ts`
- `packages/base/biz-shared/src/crud/view.tsx`
- `packages/base/biz-shared/src/index.ts`
- `packages/base/ui/src/components/data-table/DataTable.tsx`
- `packages/base/ui/src/components/data-table/DataTableSkeleton.tsx`
- `packages/base/ui/src/components/data-table/index.ts`
- `packages/base/ui/src/index.ts`
- `packages/base/ui/src/lib/list-search-params.ts`
- `packages/base/ui/src/lib/use-data-table-state.ts`
- `packages/base/ui/src/lib/use-list-search.ts`
- `packages/base/ui/src/lib/use-list-url-nav.ts`
- `tsconfig.base.json`

## 范围约束

- 聚焦客户中心 `customer-management` 及对应路由，作为全仓 CRUD 黄金标杆。
- **UI 范式**：
  - 列表：`DataTable` 列配置 + nuqs URL-as-State（禁止 `useState` 镜像 data/page）；
  - 弹窗表单：`FormModal` + Zod + `FormFieldSchema`/`sections`（禁止业务层手写 Dialog/Input/Select 树；禁止业务层直接 `useForm`）。
- 服务端：`defineServerAction` + `assertEditableFields` + `revalidatePath`；`React.cache()` 记忆化租户上下文；发号禁止 `count()+1`。
- 严禁向后兼容胶水层；标杆即终态。
- 严禁破坏 CASL 四层权限契约与多租户分库边界。
- 严禁跨越 `.archive/` 业务模块。

## 受保护区域

- CASL 权限引擎底层与 Better Auth 认证。
- 多租户分库 `TenantDbManager` 动态连接池。
- 数据库 Schema 审计基线字段（8 大审计 + 软删除）。
- Git 门禁与「提交前必须人工审阅」规则。
- 禁止 `--no-verify` 提交。

## 附带修改说明

- `packages/base/ui` 若缺 `FormModal` 字段类型或 `DataTable` 受控 props，允许增强契约本身；**不以业务切片平行封装替代**。
