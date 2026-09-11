import { DataTableRoot } from "./DataTableRoot";
import { DataTableToolbar } from "./DataTableToolbar";
import { DataTableHeader } from "./DataTableHeader";
import { DataTableSearch } from "./DataTableSearch";
import { DataTableFacetedFilter } from "./DataTableFacetedFilter";
import { DataTableFilterBar } from "./DataTableFilterBar";
import { DataTableFilterDrawer } from "./DataTableFilterDrawer";
import { DataTableInputGroup } from "./DataTableInputGroup";
import { DataTableColumnSettings } from "./DataTableColumnSettings";
import { DataTableBatchBar } from "./DataTableBatchBar";
import { DataTableContent } from "./DataTableContent";
import { DataTableRowActions } from "./DataTableRowActions";
import { DataTablePagination } from "./DataTablePagination";
import { DataTableDetailDrawer } from "./DataTableDetailDrawer";
import {
  DataTableDetailField,
  DataTableDetailPanel,
} from "./DataTableDetailLayout";
import { DataTableFormModal } from "./DataTableFormModal";
import {
  DataTableFormBanner,
  DataTableFormFieldGrid,
  DataTableFormSection,
} from "./DataTableFormLayout";
import { DataTableActions, DataTableActionButton } from "./DataTableActions";
import { AuthField, AuthGuard } from "../auth";

export * from "./DataTableContext";
export * from "./DataTableRoot";
export * from "./DataTableToolbar";
export * from "./DataTableHeader";
export * from "./DataTableSearch";
export * from "./DataTableFacetedFilter";
export * from "./DataTableFilterBar";
export * from "./DataTableFilterDrawer";
export * from "./DataTableInputGroup";
export * from "./DataTableColumnSettings";
export * from "./DataTableBatchBar";
export * from "./DataTableContent";
export * from "./DataTableRowActions";
export * from "./DataTablePagination";
export * from "./DataTableDetailDrawer";
export * from "./DataTableDetailLayout";
export * from "./DataTableFormModal";
export * from "./DataTableFormLayout";
export * from "./DataTableActions";

/**
 * 复合积木化数据表格体系 (Compound DataTable Pattern)
 *
 * 标准一体化列表装配：
 *   <DataTable.Root>
 *     <DataTable.Header actions={<DataTable.Toolbar>...</DataTable.Toolbar>} />
 *     <DataTable.FilterBar>
 *       <DataTable.InputGroup label="关键字">...</DataTable.InputGroup>
 *     </DataTable.FilterBar>
 *     <DataTable.Content selectable showIndex />
 *     <DataTable.Pagination />
 *   </DataTable.Root>
 */
export const DataTable = Object.assign(DataTableRoot, {
  Root: DataTableRoot,
  Toolbar: DataTableToolbar,
  Header: DataTableHeader,
  Search: DataTableSearch,
  FacetedFilter: DataTableFacetedFilter,
  FilterBar: DataTableFilterBar,
  FilterDrawer: DataTableFilterDrawer,
  InputGroup: DataTableInputGroup,
  ColumnSettings: DataTableColumnSettings,
  BatchBar: DataTableBatchBar,
  Content: DataTableContent,
  RowActions: DataTableRowActions,
  Pagination: DataTablePagination,
  DetailDrawer: DataTableDetailDrawer,
  DetailPanel: DataTableDetailPanel,
  DetailField: DataTableDetailField,
  FormModal: DataTableFormModal,
  FormSection: DataTableFormSection,
  FormFieldGrid: DataTableFormFieldGrid,
  FormBanner: DataTableFormBanner,
  Actions: DataTableActions,
  ActionButton: DataTableActionButton,
  AuthField: AuthField,
  AuthorizedField: AuthField,
  AuthGuard: AuthGuard,
});
