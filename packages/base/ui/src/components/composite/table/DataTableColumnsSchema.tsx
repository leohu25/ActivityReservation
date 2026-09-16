import React from "react";
import { z } from "zod";
import type { ColumnDef } from "./DataTableContext";

export interface SchemaColumnOption<TData> {
  readonly id: keyof TData & string;
  readonly header?: React.ReactNode;
  readonly field?: string;
  readonly width?: string | number;
  readonly align?: "left" | "center" | "right";
  readonly cell?: (record: TData, index: number) => React.ReactNode;
  readonly format?: (value: any, record: TData) => React.ReactNode;
  readonly defaultVisible?: boolean;
  readonly lockVisible?: boolean;
  readonly className?: string;
}

export type SchemaColumnConfig<TData> = {
  [K in keyof TData & string]?: {
    header?: React.ReactNode;
    field?: string;
    width?: string | number;
    align?: "left" | "center" | "right";
    cell?: (value: TData[K], record: TData, index: number) => React.ReactNode;
    format?: (value: TData[K], record: TData) => React.ReactNode;
    defaultVisible?: boolean;
    lockVisible?: boolean;
    className?: string;
  };
};

export interface CreateColumnsOptions<TData> {
  /** 额外的列（例如加在末尾的操作列 actions） */
  extraColumns?: readonly ColumnDef<TData>[];
  /** 覆盖指定字段的列属性（如自定义 cell、对齐、宽度等） */
  overrides?: SchemaColumnConfig<TData>;
  /** 仅包含的字段列表（用于按特定顺序排列列） */
  pick?: readonly (keyof TData & string)[];
  /** 排除的字段列表 */
  omit?: readonly (keyof TData & string)[];
}

/**
 * 根据 Zod Schema 或字段配置列表，自动派生 DataTable 的 ColumnDef 数组
 *
 * 约定与默认推导：
 * - 列 id: 字段属性名 key
 * - 列 header: 优先取 overrides.header -> z.description -> key
 * - 列 align: z.ZodNumber 自动居右 'right'，其余默认居左 'left'
 * - 列 cell: 优先取 overrides.cell -> overrides.format(val) -> 纯文本展示 (val ?? '-')
 * - 额外列: 自动在末尾追加 extraColumns（如操作列）
 */
export function createColumnsFromSchema<TData extends object>(
  schemaOrFields:
    | z.ZodObject<any>
    | readonly (keyof TData & string)[]
    | readonly SchemaColumnOption<TData>[],
  options: CreateColumnsOptions<TData> = {},
): ColumnDef<TData>[] {
  const overrides: SchemaColumnConfig<TData> = options.overrides ?? {};
  const extraColumns = options.extraColumns ?? [];
  const pick = options.pick;
  const omit = options.omit ?? [];
  const omitSet = new Set(omit);
  const columns: ColumnDef<TData>[] = [];

  // 分支 1：传入 ZodObject
  if (schemaOrFields instanceof z.ZodObject) {
    const shape = schemaOrFields.shape;
    const allKeys = Object.keys(shape) as (keyof TData & string)[];
    const targetKeys = pick ?? allKeys;

    for (const key of targetKeys) {
      if (omitSet.has(key)) continue;
      const fieldDef = shape[key];
      const isNum =
        fieldDef instanceof z.ZodNumber ||
        (fieldDef &&
          "_def" in fieldDef &&
          (fieldDef as any)._def?.typeName === "ZodNumber");

      const override = overrides[key];
      const header = override?.header ?? fieldDef?.description ?? key;
      const align = override?.align ?? (isNum ? "right" : "left");

      columns.push({
        id: key,
        header,
        field: override?.field ?? key,
        align,
        width: override?.width,
        className: override?.className,
        defaultVisible: override?.defaultVisible,
        lockVisible: override?.lockVisible,
        cell: (record: TData, idx: number) => {
          const val = record[key];
          if (override?.cell) {
            return override.cell(val, record, idx);
          }
          if (override?.format) {
            return override.format(val, record);
          }
          return val == null ? "-" : String(val);
        },
      });
    }

    return [...columns, ...extraColumns];
  }

  // 分支 2：传入字段选项数组 SchemaColumnOption[]
  if (
    Array.isArray(schemaOrFields) &&
    schemaOrFields.length > 0 &&
    typeof schemaOrFields[0] === "object"
  ) {
    const fieldOptions = schemaOrFields as readonly SchemaColumnOption<TData>[];
    for (const opt of fieldOptions) {
      if (omitSet.has(opt.id)) continue;
      if (pick && !pick.includes(opt.id)) continue;
      const override = overrides[opt.id];

      columns.push({
        id: opt.id,
        header: override?.header ?? opt.header ?? opt.id,
        field: override?.field ?? opt.field ?? opt.id,
        align: override?.align ?? opt.align ?? "left",
        width: override?.width ?? opt.width,
        className: override?.className ?? opt.className,
        defaultVisible: override?.defaultVisible ?? opt.defaultVisible,
        lockVisible: override?.lockVisible ?? opt.lockVisible,
        cell: (record: TData, idx: number) => {
          const val = record[opt.id];
          if (override?.cell) return override.cell(val, record, idx);
          if (opt.cell) return opt.cell(record, idx);
          if (override?.format) return override.format(val, record);
          if (opt.format) return opt.format(val, record);
          return val == null ? "-" : String(val);
        },
      });
    }

    return [...columns, ...extraColumns];
  }

  // 分支 3：传入纯字符串 key 数组
  const stringKeys = schemaOrFields as readonly (keyof TData & string)[];
  const targetKeys = pick ?? stringKeys;
  for (const key of targetKeys) {
    if (omitSet.has(key)) continue;
    const override = overrides[key];
    columns.push({
      id: key,
      header: override?.header ?? key,
      field: override?.field ?? key,
      align: override?.align ?? "left",
      width: override?.width,
      className: override?.className,
      defaultVisible: override?.defaultVisible,
      lockVisible: override?.lockVisible,
      cell: (record: TData, idx: number) => {
        const val = record[key];
        if (override?.cell) return override.cell(val, record, idx);
        if (override?.format) return override.format(val, record);
        return val == null ? "-" : String(val);
      },
    });
  }

  return [...columns, ...extraColumns];
}
