import { DataTableRoot } from "./DataTableRoot";
import { DataTableToolbar } from "./DataTableToolbar";
import { DataTableHeader } from "./DataTableHeader";
import { DataTableFacetedFilter } from "./DataTableFacetedFilter";
import { DataTableFilterBar } from "./DataTableFilterBar";
import { DataTableFilterDrawer } from "./DataTableFilterDrawer";
import { DataTableInputGroup } from "./DataTableInputGroup";
import { DataTableColumnSettings } from "./DataTableColumnSettings";
import { DataTableBatchBar } from "./DataTableBatchBar";
import { DataTableContent } from "./DataTableContent";
import { DataTableRowActions } from "./DataTableRowActions";
import { DataTablePagination } from "./DataTablePagination";
import { DataTableActions, DataTableActionButton } from "./DataTableActions";
import { createColumnsFromSchema } from "./DataTableColumnsSchema";
import { DataTableWorkspace } from "../../templates/DataTableWorkspace";
import { AuthField, AuthGuard } from "../auth";

export * from "./DataTableContext";
export * from "./DataTableRoot";
export * from "./DataTableToolbar";
export * from "./DataTableHeader";
export * from "./DataTableFacetedFilter";
export * from "./DataTableFilterBar";
export * from "./DataTableFilterDrawer";
export * from "./DataTableInputGroup";
export * from "./DataTableColumnSettings";
export * from "./DataTableBatchBar";
export * from "./DataTableContent";
export * from "./DataTableRowActions";
export * from "./DataTablePagination";
export * from "./DataTableActions";
export * from "./DataTableColumnsSchema";
export {
  DataTableWorkspace,
  type DataTableWorkspaceProps,
  type WorkspaceStatusOption,
} from "../../templates/DataTableWorkspace";

/**
 * 复合积木化数据表格体系 (Compound DataTable Pattern)
 * 职责单一：仅聚焦于数据表格、筛选栏、工具栏、分页与行操作，绝不侵入表单系统
 */
export const DataTable = Object.assign(DataTableRoot, {
  Root: DataTableRoot,
  Workspace: DataTableWorkspace,
  Toolbar: DataTableToolbar,
  Header: DataTableHeader,
  FacetedFilter: DataTableFacetedFilter,
  FilterBar: DataTableFilterBar,
  FilterDrawer: DataTableFilterDrawer,
  InputGroup: DataTableInputGroup,
  ColumnSettings: DataTableColumnSettings,
  BatchBar: DataTableBatchBar,
  Content: DataTableContent,
  RowActions: DataTableRowActions,
  Pagination: DataTablePagination,
  createColumnsFromSchema: createColumnsFromSchema,
  Actions: DataTableActions,
  ActionButton: DataTableActionButton,
  AuthField: AuthField,
  AuthorizedField: AuthField,
  AuthGuard: AuthGuard,
});
