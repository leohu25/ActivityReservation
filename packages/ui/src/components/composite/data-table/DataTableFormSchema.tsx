"use client";

import React, { useMemo, useState, type ReactNode } from "react";
import { Input } from "../../shadcn/input";
import { Textarea } from "../../shadcn/textarea";
import { Checkbox } from "../../shadcn/checkbox";
import { Switch } from "../../shadcn/switch";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../shadcn/select";
import { DataTableFormField, DataTableFormFieldGrid } from "./DataTableFormLayout";
import { cn } from "../../../lib/utils";

export interface FormFieldOption {
  readonly value: string;
  readonly label: string;
}

type BaseField = {
  readonly name: string;
  readonly label: string;
  readonly required?: boolean;
  readonly hint?: string;
  readonly span?: 1 | 2 | 3 | 4;
  readonly disabled?: boolean;
};

/**
 * 声明式表单字段 Schema（React 版「JSON 驱动表单」）
 * 默认走原子控件；仅 type: "custom" 时业务自绘（也应用 UI 原子组件）。
 */
export type DataTableFormFieldSchema =
  | (BaseField & {
      readonly type?: "text" | "number" | "date" | "password";
      readonly placeholder?: string;
      readonly step?: string;
    })
  | (BaseField & {
      readonly type: "select";
      readonly options: readonly FormFieldOption[];
      readonly placeholder?: string;
    })
  | (BaseField & {
      readonly type: "textarea";
      readonly placeholder?: string;
      readonly rows?: number;
    })
  | (BaseField & {
      /** 布尔开关：Checkbox 原子 */
      readonly type: "checkbox";
    })
  | (BaseField & {
      /** 布尔开关：Switch 原子 */
      readonly type: "switch";
    })
  | (BaseField & {
      readonly type: "radio";
      readonly options: readonly FormFieldOption[];
      readonly direction?: "row" | "column";
    })
  | (BaseField & {
      readonly type: "custom";
      readonly render: (ctx: {
        value: unknown;
        onChange: (value: unknown) => void;
      }) => ReactNode;
    });

export interface DataTableFormFieldsProps<TValues extends object> {
  readonly fields: readonly DataTableFormFieldSchema[];
  readonly values: TValues;
  readonly onChange: (name: keyof TValues & string, value: unknown) => void;
  /** 网格列数，默认 2 */
  readonly columns?: 2 | 3 | 4;
  readonly className?: string;
}

/** 按 Schema 循环渲染表单字段网格 */
export function DataTableFormFields<TValues extends object>({
  fields,
  values,
  onChange,
  columns = 2,
  className,
}: DataTableFormFieldsProps<TValues>) {
  return (
    <DataTableFormFieldGrid columns={columns} className={className}>
      {fields.map((field) => {
        const value = (values as Record<string, unknown>)[field.name];
        const setValue = (v: unknown) =>
          onChange(field.name as keyof TValues & string, v);
        const spanClass =
          field.span === 2
            ? "sm:col-span-2"
            : field.span === 3
              ? "sm:col-span-2 lg:col-span-3"
              : field.span === 4
                ? "sm:col-span-2 xl:col-span-4"
                : undefined;

        // checkbox/switch 标签与控件同行更紧凑
        if (field.type === "checkbox" || field.type === "switch") {
          return (
            <div
              key={field.name}
              className={cn(
                "flex min-w-0 items-center justify-between gap-3 rounded-lg border border-border/70 bg-background/60 px-3 py-2.5",
                spanClass,
              )}
            >
              <div className="flex min-w-0 flex-col gap-0.5">
                <div className="text-xs font-medium text-foreground">
                  {field.label}
                  {field.required ? (
                    <span className="text-destructive ml-0.5">*</span>
                  ) : null}
                </div>
                {field.hint ? (
                  <p className="text-[11px] text-muted-foreground">
                    {field.hint}
                  </p>
                ) : null}
              </div>
              {field.type === "checkbox" ? (
                <Checkbox
                  checked={Boolean(value)}
                  disabled={field.disabled}
                  onCheckedChange={(checked) => setValue(checked === true)}
                />
              ) : (
                <Switch
                  checked={Boolean(value)}
                  disabled={field.disabled}
                  onCheckedChange={(checked) => setValue(checked === true)}
                />
              )}
            </div>
          );
        }

        return (
          <DataTableFormField
            key={field.name}
            label={field.label}
            required={field.required}
            hint={"hint" in field ? field.hint : undefined}
            className={spanClass}
          >
            {renderFieldControl(field, value, setValue)}
          </DataTableFormField>
        );
      })}
    </DataTableFormFieldGrid>
  );
}

function renderFieldControl(
  field: DataTableFormFieldSchema,
  value: unknown,
  setValue: (v: unknown) => void,
): ReactNode {
  if (field.type === "custom") {
    return field.render({ value, onChange: setValue });
  }

  if (field.type === "select") {
    return (
      <Select
        value={value == null ? "" : String(value)}
        onValueChange={(v) => setValue(v)}
        disabled={field.disabled}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={field.placeholder ?? "请选择"} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {field.options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    );
  }

  if (field.type === "radio") {
    return (
      <div
        className={cn(
          "flex gap-3",
          field.direction === "column" ? "flex-col" : "flex-wrap",
        )}
      >
        {field.options.map((opt) => (
          <label
            key={opt.value}
            className="inline-flex items-center gap-1.5 text-xs cursor-pointer text-foreground"
          >
            <input
              type="radio"
              name={field.name}
              checked={String(value ?? "") === opt.value}
              disabled={field.disabled}
              onChange={() => setValue(opt.value)}
              className="accent-primary"
            />
            {opt.label}
          </label>
        ))}
      </div>
    );
  }

  if (field.type === "textarea") {
    return (
      <Textarea
        required={field.required}
        disabled={field.disabled}
        rows={field.rows ?? 3}
        placeholder={field.placeholder}
        value={value == null ? "" : String(value)}
        onChange={(e) => setValue(e.target.value)}
      />
    );
  }

  return (
    <Input
      type={field.type ?? "text"}
      required={field.required}
      disabled={field.disabled}
      step={"step" in field ? field.step : undefined}
      placeholder={"placeholder" in field ? field.placeholder : undefined}
      value={value == null ? "" : String(value)}
      onChange={(e) => {
        const raw = e.target.value;
        if (field.type === "number") {
          setValue(raw === "" ? null : Number(raw));
          return;
        }
        setValue(raw);
      }}
    />
  );
}

/**
 * Schema 表单状态 Hook：values + setField + patch
 */
export function useDataTableForm<TValues extends object>(
  initial: TValues,
): {
  values: TValues;
  setField: (name: keyof TValues & string, value: unknown) => void;
  patch: (partial: Partial<TValues>) => void;
  reset: () => void;
} {
  const [values, setValues] = useState<TValues>(initial);
  const initialRef = useMemo(() => initial, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    values,
    setField: (name, value) =>
      setValues((prev) => ({ ...prev, [name]: value })),
    patch: (partial) => setValues((prev) => ({ ...prev, ...partial })),
    reset: () => setValues(initialRef),
  };
}
