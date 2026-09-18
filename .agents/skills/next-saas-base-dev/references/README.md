# next-saas-base-dev / references 索引

> 根 `SKILL.md` 只做地图；**实现细节全部在本目录**。  
> 标杆 SOP：[`9-crud-resource-paradigm.md`](./9-crud-resource-paradigm.md)（必读）

| 文档 | 内容 |
| :--- | :--- |
| `0-architecture-topology.md` | 切片包骨架、exports、数据流向 |
| `1-contracts.md` | 权限契约 + `defineListSearchParams` |
| `2-schema-migrate.md` | Prisma 模型 / 审计基线 / 迁移 |
| `3-services.md` | service / server-only queries / cache / DTO |
| `4-server-actions.md` | `createResourceActions` 与 `defineServerAction` |
| `5-ui-components.md` | `DataTable` chrome、`useListSearch`、`FormModal` |
| `6-tenant-routing.md` | `createResourcePage`、manifest、单测 |
| `7-casl-ability-provider.md` | AbilityProvider / subject |
| `8-base-infrastructure.md` | `@base/*` 职责与依赖铁律 |
| `9-crud-resource-paradigm.md` | **客户档案黄金标杆 8 步 SOP** |

## 现行约定速查

| 主题 | 约定 |
| :--- | :--- |
| 业务包路径 | `packages/domains/*`、`packages/platform/*` |
| 列表 URL | `defineListSearchParams` + `useListSearch` |
| 列表 UI | `DataTable` 默认 chrome + `filterExtra` |
| 表单 | `FormModal` + schema/fields |
| Actions | `@base/biz-shared` `createResourceActions`（平铺 export） |
| Page | `createResourcePage` |
| 刷新 | Action 内 `revalidatePath` |

## 作废 API（禁止新代码）

`useTableUrlState`、`parseTableSearchParams`、`useDataTableState`、`useListUrlNav`、`table.bindProps`、业务层 RHF 手写字段树、ListShell/TableRegion、`initial*` 镜像 props、`count(*)+1` 发号、单开 `@base/crud`。
