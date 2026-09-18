import type { ReactNode } from "react";
import type { ColumnDef } from "@base/ui";
import type { DefinedListSearchParams, ListSearchParamsValues } from "@base/ui";

/** Server Action 统一返回（与 @base/shared defineServerAction 对齐） */
export type ResourceActionResult<T = unknown> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: string };

/** 切片注入的运行时上下文（client / ability / userId 等） */
export interface ResourceContext {
  readonly client: unknown;
  readonly ability: unknown;
  readonly userId: string;
  readonly deptId?: string | null;
  readonly [key: string]: unknown;
}

export interface ResourceListResult<TRow> {
  readonly items: TRow[];
  readonly total: number;
}

export interface ResourceServicePort<TCreate, TUpdate, TRow> {
  readonly create?: (
    client: unknown,
    input: TCreate,
    ctx: { userId: string; deptId?: string | null },
  ) => Promise<TRow>;
  readonly update?: (
    client: unknown,
    id: string,
    input: TUpdate,
    ctx: { userId: string },
  ) => Promise<TRow>;
  readonly remove?: (
    client: unknown,
    id: string,
    ctx: { userId: string },
  ) => Promise<unknown>;
  readonly toggleStatus?: (
    client: unknown,
    id: string,
    status: string,
    ctx: { userId: string },
  ) => Promise<TRow>;
}

export interface ResourceActionsConfig<TCreate, TUpdate, TRow> {
  readonly getContext: () => Promise<ResourceContext>;
  readonly subject: string;
  readonly controlledFields: readonly string[];
  readonly assertAbility: (
    ability: unknown,
    action: string,
    subject: string,
  ) => void;
  readonly revalidatePaths: readonly string[];
  readonly schemas?: {
    readonly create?: (raw: unknown) => TCreate;
    readonly update?: (raw: unknown) => TUpdate;
  };
  readonly service: ResourceServicePort<TCreate, TUpdate, TRow>;
  readonly toggleAction?: string;
  readonly toggleExtraRevalidatePaths?: readonly string[];
  readonly errorMessages?: {
    readonly create?: string;
    readonly update?: string;
    readonly delete?: string;
    readonly toggle?: string;
  };
  readonly onBeforeCreate?: (
    input: TCreate,
    ctx: ResourceContext,
  ) => Promise<TCreate> | TCreate;
  readonly onBeforeUpdate?: (
    id: string,
    input: TUpdate,
    ctx: ResourceContext,
  ) => Promise<TUpdate> | TUpdate;
}

export interface ResourceListConfig<TRow, TOptions> {
  /** 列表 URL 参数契约（@base/ui defineListSearchParams） */
  readonly search: DefinedListSearchParams;
  readonly subject: string;
  readonly pageContract: {
    readonly subject: string;
    readonly configurableFields?: readonly {
      readonly field: string;
      readonly label: string;
      readonly sensitive?: boolean;
    }[];
  };
  readonly title: string;
  readonly description?: string;
  readonly rowKey: (row: TRow) => string;
  readonly columns: readonly ColumnDef<TRow>[];
  readonly keywordPlaceholder?: string;
  readonly statusOptions?: readonly { value: string; label: string }[];
  readonly statusField?: string;
  readonly actions: {
    readonly create?: (input: unknown) => Promise<ResourceActionResult<TRow>>;
    readonly update?: (
      id: string,
      input: unknown,
    ) => Promise<ResourceActionResult<TRow>>;
    readonly remove?: (id: string) => Promise<ResourceActionResult<unknown>>;
    readonly toggleStatus?: (
      id: string,
      status: string,
    ) => Promise<ResourceActionResult<TRow>>;
  };
  readonly form?: {
    readonly schema?: unknown;
    readonly sections?: readonly unknown[];
    readonly fields?: readonly unknown[];
    readonly toInitialValues?: (
      row: TRow | null,
      mode: string,
    ) => Record<string, unknown>;
    readonly buildCreateInput?: (values: Record<string, unknown>) => unknown;
    readonly buildUpdateInput?: (values: Record<string, unknown>) => unknown;
  };
  readonly renderList?: (props: ResourceListProps<TRow, TOptions>) => ReactNode;
  readonly filterExtra?: (
    params: ListSearchParamsValues,
    patch: (p: Record<string, unknown>) => void,
  ) => ReactNode;
  readonly onExport?: (rows: TRow[]) => void;
  readonly createText?: string;
}

export interface ResourceListProps<TRow, TOptions = unknown> {
  readonly data: TRow[];
  readonly total: number;
  readonly options?: TOptions | null;
}

export interface ResourcePageConfig<TRow, TOptions>
  extends Omit<ResourceListConfig<TRow, TOptions>, "actions"> {
  readonly actions?: ResourceListConfig<TRow, TOptions>["actions"];
  readonly query: {
    readonly list: (
      parsed: ListSearchParamsValues,
    ) => Promise<ResourceListResult<TRow>>;
    readonly options?: (
      parsed: ListSearchParamsValues,
    ) => Promise<TOptions | null>;
  };
  /** 自定义 Client 列表（逃生舱，优先于工厂 List） */
  readonly List?: (props: ResourceListProps<TRow, TOptions>) => ReactNode;
}
