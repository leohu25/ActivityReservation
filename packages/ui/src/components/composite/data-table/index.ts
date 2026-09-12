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
 DataTableFormField,
 DataTableFormFieldGrid,
 DataTableFormSection,
} from "./DataTableFormLayout";
import { DataTableActions, DataTableActionButton } from "./DataTableActions";
import {
 DataTableFormFields,
 useDataTableForm,
 type DataTableFormFieldSchema,
 type FormFieldOption,
} from "./DataTableFormSchema";
import { createColumnsFromSchema } from "./DataTableColumnsSchema";
// 模板层：整页 Workspace（目录在 templates/，此处挂到 DataTable 命名空间）
import { DataTableWorkspace } from "../../templates/DataTableWorkspace";
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
export * from "./DataTableFormSchema";
export * from "./DataTableColumnsSchema";
export {
 DataTableWorkspace,
 type DataTableWorkspaceProps,
 type WorkspaceStatusOption,
} from "../../templates/DataTableWorkspace";

/**
 * 复合积木化数据表格体系 (Compound DataTable Pattern)
 *
 * 推荐整页模板（约定大于配置，默认全量控件）：
 *   <DataTable.Workspace title="客户档案" ... />
 *
 * 原子拼装仍可用：
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
 Workspace: DataTableWorkspace,
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
 FormField: DataTableFormField,
 FormFields: DataTableFormFields,
 useForm: useDataTableForm,
 FormBanner: DataTableFormBanner,
 createColumnsFromSchema: createColumnsFromSchema,
 Actions: DataTableActions,
 ActionButton: DataTableActionButton,
 AuthField: AuthField,
 AuthorizedField: AuthField,
 AuthGuard: AuthGuard,
});
