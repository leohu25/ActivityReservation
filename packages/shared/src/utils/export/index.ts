/**
 * 通用 CSV 导出（与业务无关）
 * 字段清单优先由页面契约 configurableFields 循环收集，再按字段权限过滤后下载。
 */

export interface ContractFieldMeta {
  readonly field: string;
  readonly label: string;
}

export interface AbilityLike {
  can(action: string, subject: string, field?: string): boolean;
}

export interface ResolveExportFieldsOptions<T> {
  readonly subject: string;
  readonly ability?: AbilityLike;
  /** 契约 field → 行数据 key（默认同名） */
  readonly keyOf?: (field: string) => string;
  /** 跳过敏感/本页不导出的契约字段 */
  readonly skip?: readonly string[];
  /** 自定义单元格格式化（枚举转中文、日期截断等） */
  readonly format?: Readonly<
    Record<string, (row: T) => string | number | null | undefined>
  >;
}

export interface ResolvedExportField {
  readonly key: string;
  readonly label: string;
  readonly format?: (row: never) => string | number | null | undefined;
}

/** 从契约字段元数据派生可导出列（含权限过滤） */
export function resolveExportFields<T>(
  contractFields: readonly ContractFieldMeta[],
  options: ResolveExportFieldsOptions<T>,
): ResolvedExportField[] {
  const { subject, ability, keyOf, skip, format } = options;
  const skipSet = new Set(skip ?? []);

  return contractFields
    .filter((meta) => {
      if (skipSet.has(meta.field)) return false;
      if (!ability) return true;
      return ability.can("read", subject, meta.field);
    })
    .map((meta) => ({
      key: keyOf ? keyOf(meta.field) : meta.field,
      label: meta.label,
      format: format?.[meta.field] as ResolvedExportField["format"],
    }));
}

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text =
    value instanceof Date ? value.toISOString().slice(0, 10) : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

/** 将行数据按字段清单导出为 CSV（带 BOM，Excel 可直接打开） */
export function exportRowsToCsv<T extends object>(
  rows: readonly T[],
  fields: readonly ResolvedExportField[],
  filename: string,
): void {
  if (typeof document === "undefined") return;

  const csv = [
    fields.map((f) => f.label).join(","),
    ...rows.map((row) =>
      fields
        .map((f) =>
          csvEscape(
            f.format
              ? f.format(row as never)
              : (row as Record<string, unknown>)[f.key],
          ),
        )
        .join(","),
    ),
  ].join("\n");

  const blob = new Blob([`﻿${csv}`], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** 契约字段 + 权限 + 一键下载 */
export function exportContractCsv<T extends object>(
  rows: readonly T[],
  contractFields: readonly ContractFieldMeta[],
  options: ResolveExportFieldsOptions<T> & { filename: string },
): void {
  const { filename, ...resolveOptions } = options;
  const fields = resolveExportFields(contractFields, resolveOptions);
  exportRowsToCsv(rows, fields, filename);
}
