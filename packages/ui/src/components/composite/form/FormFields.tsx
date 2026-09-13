import React from "react";
import { Input } from "../../shadcn/input";
import { Textarea } from "../../shadcn/textarea";
import { Checkbox } from "../../shadcn/checkbox";
import { Switch } from "../../shadcn/switch";
import { DatePicker } from "../../shadcn/date-picker";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../../shadcn/select";
import { FormFieldGrid } from "./FormLayout";
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

export type FormFieldSchema =
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
          readonly type: "checkbox";
      })
    | (BaseField & {
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
          }) => React.ReactNode;
      });

export interface FormFieldsProps<TValues extends object> {
    readonly fields: readonly FormFieldSchema[];
    readonly values: TValues;
    readonly onChange: (name: keyof TValues & string, value: unknown) => void;
    readonly columns?: 2 | 3 | 4;
    readonly className?: string;
    readonly errors?: Partial<Record<keyof TValues & string, string>>;
}

export function FormFields<TValues extends object>({
    fields,
    values,
    onChange,
    columns = 2,
    className,
    errors,
}: FormFieldsProps<TValues>) {
    return (
        <FormFieldGrid columns={columns} className={className}>
            {fields.map((field) => {
                const value = (values as Record<string, unknown>)[field.name];
                const setValue = (v: unknown) =>
                    onChange(field.name as keyof TValues & string, v);
                const fieldError =
                    errors?.[field.name as keyof TValues & string];
                const spanClass =
                    field.span === 2
                        ? "sm:col-span-2"
                        : field.span === 3
                          ? "sm:col-span-2 lg:col-span-3"
                          : field.span === 4
                            ? "sm:col-span-2 xl:col-span-4"
                            : undefined;

                if (field.type === "checkbox" || field.type === "switch") {
                    return (
                        <div
                            key={field.name}
                            className={cn(
                                "flex min-w-0 items-center justify-between gap-3 rounded-lg border border-border/70 bg-background/60 px-3 py-2.5",
                                fieldError &&
                                    "border-destructive/60 bg-destructive/5",
                                spanClass,
                            )}
                        >
                            <div className="flex min-w-0 flex-col gap-0.5">
                                <div className="text-xs font-medium text-foreground">
                                    {field.label}
                                    {field.required ? (
                                        <span className="text-destructive ml-0.5">
                                            *
                                        </span>
                                    ) : null}
                                </div>
                                {field.hint ? (
                                    <p className="text-[11px] text-muted-foreground">
                                        {field.hint}
                                    </p>
                                ) : null}
                                {fieldError ? (
                                    <p
                                        data-slot="form-message"
                                        className="text-xs font-medium text-destructive mt-0.5"
                                    >
                                        {fieldError}
                                    </p>
                                ) : null}
                            </div>
                            {field.type === "checkbox" ? (
                                <Checkbox
                                    checked={Boolean(value)}
                                    disabled={field.disabled}
                                    onCheckedChange={(checked) =>
                                        setValue(checked === true)
                                    }
                                    aria-invalid={Boolean(fieldError)}
                                />
                            ) : (
                                <Switch
                                    checked={Boolean(value)}
                                    disabled={field.disabled}
                                    onCheckedChange={(checked) =>
                                        setValue(checked === true)
                                    }
                                    aria-invalid={Boolean(fieldError)}
                                />
                            )}
                        </div>
                    );
                }

                return (
                    <div
                        key={field.name}
                        className={cn("flex flex-col gap-1.5", spanClass)}
                    >
                        <div className="text-xs font-medium text-foreground">
                            {field.label}
                            {field.required ? (
                                <span className="text-destructive ml-0.5">
                                    *
                                </span>
                            ) : null}
                        </div>
                        {renderFieldControl(field, value, setValue, fieldError)}
                        {field.hint && !fieldError ? (
                            <p className="text-[11px] text-muted-foreground">
                                {field.hint}
                            </p>
                        ) : null}
                        {fieldError ? (
                            <p
                                data-slot="form-message"
                                className="text-xs font-medium text-destructive mt-0.5"
                            >
                                {fieldError}
                            </p>
                        ) : null}
                    </div>
                );
            })}
        </FormFieldGrid>
    );
}

function renderFieldControl(
    field: FormFieldSchema,
    value: unknown,
    setValue: (v: unknown) => void,
    fieldError?: string,
) {
    const isInvalid = Boolean(fieldError);

    if (field.type === "select") {
        return (
            <Select
                value={String(value ?? "")}
                onValueChange={setValue}
                disabled={field.disabled}
            >
                <SelectTrigger
                    aria-invalid={isInvalid}
                    className={cn(
                        "w-full",
                        isInvalid && "border-destructive ring-destructive/20",
                    )}
                >
                    <SelectValue placeholder={field.placeholder || "请选择"} />
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

    if (field.type === "textarea") {
        return (
            <Textarea
                value={String(value ?? "")}
                onChange={(e) => setValue(e.target.value)}
                placeholder={field.placeholder}
                rows={field.rows || 3}
                disabled={field.disabled}
                aria-invalid={isInvalid}
                className={cn(
                    isInvalid && "border-destructive ring-destructive/20",
                )}
            />
        );
    }

    if (field.type === "date") {
        return (
            <DatePicker
                value={value as string | Date | null | undefined}
                onChange={(dateStr) => setValue(dateStr)}
                placeholder={field.placeholder || "请选择日期"}
                disabled={field.disabled}
                aria-invalid={isInvalid}
            />
        );
    }

    if (field.type === "custom") {
        return field.render({ value, onChange: setValue });
    }

    return (
        <Input
            type={field.type || "text"}
            value={value === null || value === undefined ? "" : String(value)}
            onChange={(e) => {
                const raw = e.target.value;
                if (field.type === "number") {
                    setValue(raw === "" ? "" : Number(raw));
                } else {
                    setValue(raw);
                }
            }}
            placeholder={"placeholder" in field ? field.placeholder : undefined}
            step={"step" in field ? field.step : undefined}
            disabled={field.disabled}
            aria-invalid={isInvalid}
            className={cn(
                isInvalid && "border-destructive ring-destructive/20",
            )}
        />
    );
}
