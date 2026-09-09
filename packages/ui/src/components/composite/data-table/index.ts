import { DataTableRoot } from "./DataTableRoot";
import { DataTableToolbar } from "./DataTableToolbar";
import { DataTableSearch } from "./DataTableSearch";
import { DataTableFacetedFilter } from "./DataTableFacetedFilter";
import { DataTableFilterDrawer } from "./DataTableFilterDrawer";
import { DataTableBatchBar } from "./DataTableBatchBar";
import { DataTableContent } from "./DataTableContent";
import { DataTableRowActions } from "./DataTableRowActions";
import { DataTablePagination } from "./DataTablePagination";
import { DataTableDetailDrawer } from "./DataTableDetailDrawer";
import { DataTableFormModal } from "./DataTableFormModal";
import { DataTableActions, DataTableActionButton } from "./DataTableActions";
import { AuthField, AuthGuard } from "../auth";

export * from "./DataTableContext";
export * from "./DataTableRoot";
export * from "./DataTableToolbar";
export * from "./DataTableSearch";
export * from "./DataTableFacetedFilter";
export * from "./DataTableFilterDrawer";
export * from "./DataTableBatchBar";
export * from "./DataTableContent";
export * from "./DataTableRowActions";
export * from "./DataTablePagination";
export * from "./DataTableDetailDrawer";
export * from "./DataTableFormModal";
export * from "./DataTableActions";

/**
 * 复合积木化数据表格体系 (Compound DataTable Pattern)
 *
 * 既可按需逐一引入原子零件：
 *   import { DataTableSearch, DataTablePagination, DataTableDetailDrawer, DataTableFormModal } from "@chenrun/ui";
 * 也可通过复合命名空间自由组装：
 *   <DataTable.Root ...>
 *     <DataTable.Toolbar>
 *       <DataTable.Search />
 *       <DataTable.FacetedFilter />
 *       <DataTable.FilterDrawer />
 *       <DataTable.Actions>
 *         <DataTable.ActionButton action="create">新建</DataTable.ActionButton>
 *       </DataTable.Actions>
 *     </DataTable.Toolbar>
 *     <DataTable.BatchBar />
 *     <DataTable.Content />
 *     <DataTable.Pagination />
 *   </DataTable.Root>
 */
export const DataTable = Object.assign(DataTableRoot, {
 Root: DataTableRoot,
 Toolbar: DataTableToolbar,
 Search: DataTableSearch,
 FacetedFilter: DataTableFacetedFilter,
 FilterDrawer: DataTableFilterDrawer,
 BatchBar: DataTableBatchBar,
 Content: DataTableContent,
 RowActions: DataTableRowActions,
 Pagination: DataTablePagination,
 DetailDrawer: DataTableDetailDrawer,
 FormModal: DataTableFormModal,
 Actions: DataTableActions,
 ActionButton: DataTableActionButton,
 AuthField: AuthField,
 AuthorizedField: AuthField,
 AuthGuard: AuthGuard,
});
