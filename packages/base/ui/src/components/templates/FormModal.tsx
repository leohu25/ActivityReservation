"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import type { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../shadcn/dialog";
import { Button } from "../shadcn/button";
import { FormFields, type FormFieldSchema } from "../composite/form/FormFields";
import { FormBanner } from "../composite/form/FormLayout";
import {
  DetailTable,
  type DetailTableColumn,
} from "../composite/table/DetailTable";
import { toast } from "../feedback/Toast";
import { useUiAbility, type UiAbilityLike } from "../composite/auth";
import { cn } from "../../lib/utils";

export type FormModalMode = "create" | "edit" | "view";

const EMPTY_INITIAL_ITEMS: readonly any[] = [];
const EMPTY_ACTIONS: readonly any[] = [];

function safeSerialize(val: unknown): string {
  try {
    return JSON.stringify(val);
  } catch {
    return "";
  }
}

export interface FormModalSection {
  readonly title?: string;
  readonly description?: string;
  readonly fields: readonly FormFieldSchema[];
  readonly columns?: 2 | 3 | 4;
}

export interface FormModalDetailConfig<TItem> {
  readonly title?: string;
  readonly description?: string;
  readonly columns: readonly DetailTableColumn<TItem>[];
  readonly onAddRow?: () => TItem;
  readonly addText?: string;
  readonly minRows?: number;
  readonly readOnly?: boolean;
  readonly emptyText?: string;
  readonly summary?: ReactNode;
  readonly schema?: z.ZodType<any>;
}

export interface FormModalProps<
  TValues extends Record<string, unknown> = Record<string, unknown>,
  TItem = unknown,
> {
  readonly open: boolean;
  readonly mode?: FormModalMode;
  readonly title?: ReactNode | ((values: TValues) => ReactNode);
  readonly description?: ReactNode | ((values: TValues) => ReactNode);
  readonly badge?: string;
  readonly bannerTitle?: string;
  readonly bannerDescription?: string;
  readonly banner?: {
    readonly title: string;
    readonly description?: string;
  };
  readonly headerExtra?: ReactNode;

  // 字段配置 (单个列表或多区块)
  readonly fields?: readonly FormFieldSchema[];
  readonly sections?: readonly FormModalSection[];

  // 初始值与联动
  readonly initialValues: TValues;
  readonly onValuesChange?: (
    name: keyof TValues & string,
    value: unknown,
    prevValues: TValues,
  ) => Partial<TValues> | void;

  // Zod 运行时强类型校验
  readonly schema?: z.ZodType<TValues> | z.ZodType<any>;

  // 内置明细表集成 (DetailTable)
  readonly detailConfig?: FormModalDetailConfig<TItem>;
  readonly initialItems?: readonly TItem[];
  readonly items?: readonly TItem[];
  readonly onItemsChange?: (items: TItem[]) => void;
  readonly itemsSchema?: z.ZodType<any>;

  // 关闭与提交
  readonly onClose?: () => void;
  readonly onOpenChange?: (open: boolean) => void;
  readonly onSubmit?: (
    values: TValues,
    context: { items: TItem[] },
  ) => Promise<void> | void;
  readonly submitText?: string;
  readonly cancelText?: string;
  readonly auditHint?: string | null;
  readonly extraActions?: readonly {
    readonly key: string;
    readonly label: string;
    readonly variant?: "default" | "outline" | "ghost" | "destructive";
    readonly onClick: (values: TValues) => void | Promise<void>;
  }[];

  /**
   * 业务实体 Subject (如 'Customer', 'PurchaseOrder')。
   * 声明后 FormModal 将全自动结合 CASL Ability 执行字段三态闭环：
   * - HIDDEN (不可读): 自动从 fields / sections 中彻底剥离隐藏；
   * - READONLY (可读不可写): 在新增/编辑模式下自动标记 disabled 并展示只读提示；
   * - 整组字段全部被隐藏的 section 自动剔除。
   */
  readonly subject?: string;

  /**
   * 可选 Ability 覆盖注入。
   * 默认自动从上下文 UiAbilityProvider (useUiAbility) 读取。
   */
  readonly ability?: UiAbilityLike | null;

  // 布局控制与扩展插槽
  readonly columns?: 2 | 3 | 4;
  readonly inline?: boolean;
  readonly className?: string;
  readonly contentClassName?: string;
  readonly extraContent?: ReactNode | ((values: TValues) => ReactNode);
  readonly children?:
    | ReactNode
    | ((context: {
        values: TValues;
        close: () => void;
        loading: boolean;
      }) => ReactNode);
  readonly footer?:
    | ReactNode
    | ((context: {
        values: TValues;
        close: () => void;
        loading: boolean;
      }) => ReactNode);
}

/**
 * 统一通用表单模态框模板 (FormModal)
 * - 彻底收敛表单模态框形态，同时支持 create、edit、view 三态感知
 * - 纯基于 TypeScript + Zod Schema 强类型运行时校验 (safeParse) 驱动
 * - 内置可选 DetailTable 明细表，view 模式下自动转为只读呈现
 * - 原生支持 inline 模式以便在 SSR 与单元测试中直接渲染
 */
export function FormModal<
  TValues extends Record<string, unknown> = Record<string, unknown>,
  TItem = unknown,
>({
  open,
  mode = "create",
  title,
  description,
  badge = "CR",
  bannerTitle,
  bannerDescription,
  banner,
  headerExtra,
  fields,
  sections,
  initialValues,
  onValuesChange,
  schema,
  subject,
  ability: explicitAbility,
  detailConfig,
  initialItems = EMPTY_INITIAL_ITEMS,
  items: controlledItems,
  onItemsChange,
  itemsSchema,
  onClose,
  onOpenChange,
  onSubmit,
  submitText,
  cancelText,
  auditHint,
  extraActions = EMPTY_ACTIONS,
  columns = 2,
  inline = false,
  className,
  contentClassName,
  extraContent,
  children,
  footer,
}: FormModalProps<TValues, TItem>) {
  const activeDetailConfig = detailConfig;
  const effectiveSchema = schema;
  const effectiveItemsSchema = itemsSchema ?? activeDetailConfig?.schema;
  const isView = mode === "view";

  const getFreshValues = useCallback((): TValues => {
    try {
      return structuredClone(initialValues);
    } catch {
      return JSON.parse(JSON.stringify(initialValues));
    }
  }, [initialValues]);

  const [values, setValues] = useState<TValues>(getFreshValues);
  const valuesRef = useRef<TValues>(values);
  valuesRef.current = values;
  const [internalItems, setInternalItems] = useState<TItem[]>(() => [
    ...initialItems,
  ]);
  const items = controlledItems ?? internalItems;
  const [errors, setErrors] = useState<
    Partial<Record<keyof TValues & string, string>>
  >({});
  const [submitting, setSubmitting] = useState(false);

  const prevOpenRef = useRef(open);
  const prevValuesSerializedRef = useRef<string>(safeSerialize(initialValues));
  const prevItemsSerializedRef = useRef<string>(safeSerialize(initialItems));
  const isFirstMountRef = useRef(true);

  // 模态框打开或初始值变更时重置（跳过初次 mount 时的多余重置，并深度校验序列化值防死循环）
  useEffect(() => {
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      return;
    }

    const justOpened = !prevOpenRef.current && open;
    prevOpenRef.current = open;

    if (!open) return;

    const currentValuesSerialized = safeSerialize(initialValues);
    const currentItemsSerialized = safeSerialize(initialItems);
    const valuesChanged =
      currentValuesSerialized !== prevValuesSerializedRef.current;
    const itemsChanged =
      currentItemsSerialized !== prevItemsSerializedRef.current;

    if (justOpened || valuesChanged || itemsChanged) {
      const fresh = getFreshValues();
      valuesRef.current = fresh;
      setValues(fresh);
      setInternalItems([...initialItems]);
      setErrors({});
      prevValuesSerializedRef.current = currentValuesSerialized;
      prevItemsSerializedRef.current = currentItemsSerialized;
    }
  }, [open, getFreshValues, initialItems, initialValues]);

  const handleClose = useCallback(() => {
    const fresh = getFreshValues();
    valuesRef.current = fresh;
    setValues(fresh);
    setInternalItems([...initialItems]);
    setErrors({});
    onOpenChange?.(false);
    onClose?.();
  }, [getFreshValues, initialItems, onOpenChange, onClose]);

  // Ability 权限感知：优先取显式传入，未传取上层 UI AbilityProvider
  const contextAbility = useUiAbility();
  const effectiveAbility =
    explicitAbility === undefined ? contextAbility : explicitAbility;
  const writeAction = mode === "create" ? "create" : "update";

  const filterAndDecorateField = useCallback(
    (field: FormFieldSchema): FormFieldSchema | null => {
      // 1. 若未指定受控主体 subject 或无 ability 上下文，按常规 isView 基础禁用返回
      if (!subject || !effectiveAbility) {
        return isView ? { ...field, disabled: true } : field;
      }

      // 2. 检查读取权限 (HIDDEN 彻底剥离剔除，优先使用 field 别名映射)
      const authKey = field.field || field.name;
      const canRead = effectiveAbility.can("read", subject, authKey);
      if (!canRead) {
        return null;
      }

      // 3. 查看模式下全部只读置灰
      if (isView) {
        return { ...field, disabled: true };
      }

      // 4. 新增/编辑模式下检查写入权限 (READONLY 禁用置灰并附带提示)
      const canWrite = effectiveAbility.can(writeAction, subject, authKey);
      if (!canWrite) {
        return {
          ...field,
          disabled: true,
          hint: field.hint
            ? `${field.hint} (受字段权限控制，当前角色不可修改)`
            : "受字段权限控制，当前角色不可修改",
        };
      }

      return field;
    },
    [subject, effectiveAbility, isView, writeAction],
  );

  // 模式与权限感知：自动剔除 HIDDEN 字段，自动禁用 READONLY 字段
  const activeFields = useMemo(() => {
    if (!fields) return [];
    return fields
      .map(filterAndDecorateField)
      .filter((f): f is FormFieldSchema => f !== null);
  }, [fields, filterAndDecorateField]);

  const activeSections = useMemo(() => {
    if (!sections) return [];
    return sections
      .map((s) => {
        const visibleFields = s.fields
          .map(filterAndDecorateField)
          .filter((f): f is FormFieldSchema => f !== null);
        return {
          ...s,
          fields: visibleFields,
        };
      })
      .filter((s) => s.fields.length > 0);
  }, [sections, filterAndDecorateField]);

  // 收集当前界面真正可见的字段名称集合，供动态必填校验与提交过滤使用
  const visibleFieldNames = useMemo(() => {
    const names = new Set<string>();
    for (const f of activeFields) {
      names.add(f.name);
    }
    for (const s of activeSections) {
      for (const f of s.fields) {
        names.add(f.name);
      }
    }
    return names;
  }, [activeFields, activeSections]);

  const handleFieldChange = (name: keyof TValues & string, val: unknown) => {
    const prev = valuesRef.current;
    const sideEffects = onValuesChange?.(name, val, prev);
    const merged = sideEffects
      ? { ...prev, [name]: val, ...sideEffects }
      : { ...prev, [name]: val };
    valuesRef.current = merged;
    setValues(merged);

    // 如果当前字段有报错，输入修改时自动重新执行 Zod safeParse 校验该字段
    if (effectiveSchema && errors[name]) {
      const res = effectiveSchema.safeParse(merged);
      if (res.success) {
        setErrors({});
      } else {
        const stillHasIssue = res.error.issues.find((i) => i.path[0] === name);
        if (stillHasIssue) {
          setErrors((prevErr) => ({
            ...prevErr,
            [name]: stillHasIssue.message,
          }));
        } else {
          setErrors((prevErr) => {
            const nextErr = { ...prevErr };
            delete nextErr[name];
            return nextErr;
          });
        }
      }
    }
  };

  const handleItemsChange = (nextItems: TItem[]) => {
    if (controlledItems === undefined) {
      setInternalItems(nextItems);
    }
    onItemsChange?.(nextItems);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isView) return;

    if (effectiveSchema) {
      const parseResult = effectiveSchema.safeParse(values);
      if (!parseResult.success) {
        const newErrors: Partial<Record<keyof TValues & string, string>> = {};
        for (const issue of parseResult.error.issues) {
          const fieldName = String(issue.path[0] ?? "");
          // 豁免逻辑：若当前启用了受控主体权限 (subject)，且该字段被 HIDDEN 彻底隐藏（不在可见字段集合），自动豁免该字段的校验错误
          if (
            subject &&
            effectiveAbility &&
            !visibleFieldNames.has(fieldName)
          ) {
            continue;
          }
          if (fieldName && !newErrors[fieldName as keyof TValues & string]) {
            newErrors[fieldName as keyof TValues & string] = issue.message;
          }
        }
        if (Object.keys(newErrors).length > 0) {
          setErrors(newErrors);
          toast.error("表单数据校验未通过，请检查红字提示");
          return;
        }
      }
    }

    if (effectiveItemsSchema) {
      const itemsResult = effectiveItemsSchema.safeParse(items);
      if (!itemsResult.success) {
        const firstIssue = itemsResult.error.issues[0];
        toast.error(firstIssue?.message || "明细行数据校验未通过");
        return;
      }
    }

    setErrors({});
    if (!onSubmit) {
      handleClose();
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit(values, { items: [...items] });
      handleClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "提交表单失败";
      toast.error(msg);
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const defaultTitle =
    mode === "create" ? "新增记录" : mode === "edit" ? "编辑记录" : "查看详情";
  const defaultSubmitText = mode === "create" ? "立即创建" : "保存修改";

  const renderedTitle =
    typeof title === "function" ? title(values) : (title ?? defaultTitle);
  const renderedDescription =
    typeof description === "function" ? description(values) : description;

  const effectiveBanner =
    banner ??
    (bannerTitle
      ? { title: bannerTitle, description: bannerDescription }
      : undefined);

  const brandHeader = (
    <div className="flex items-start gap-3 pr-8">
      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-xs font-bold tracking-wide text-primary-foreground shadow-xs">
        {badge}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1 pt-0.5">
        <div className="text-base font-semibold tracking-tight text-foreground">
          {renderedTitle}
        </div>
        {renderedDescription ? (
          <p className="text-xs leading-relaxed text-muted-foreground">
            {renderedDescription}
          </p>
        ) : null}
      </div>
    </div>
  );

  const defaultFooter = (
    <div className="flex items-center justify-between gap-3 pt-2 border-t border-border/60">
      <div className="text-xs text-muted-foreground">{auditHint}</div>
      <div className="flex items-center gap-2">
        {extraActions.map((act) => (
          <Button
            key={act.key}
            type="button"
            variant={act.variant || "outline"}
            size="sm"
            onClick={() => act.onClick(values)}
          >
            {act.label}
          </Button>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={handleClose}>
          {cancelText || (isView ? "关闭" : "取消")}
        </Button>
        {!isView && onSubmit ? (
          <Button
            type="submit"
            size="sm"
            disabled={submitting}
            onClick={() => handleSubmit()}
          >
            {submitting ? "正在保存..." : submitText || defaultSubmitText}
          </Button>
        ) : null}
      </div>
    </div>
  );

  const renderedFooter =
    typeof footer === "function"
      ? footer({ values, close: handleClose, loading: submitting })
      : (footer ?? defaultFooter);

  const body = (
    <div className={cn("space-y-4", contentClassName)}>
      {effectiveBanner ? (
        <FormBanner
          title={effectiveBanner.title}
          description={effectiveBanner.description}
        />
      ) : null}

      {children ? (
        typeof children === "function" ? (
          children({ values, close: handleClose, loading: submitting })
        ) : (
          children
        )
      ) : (
        <>
          {activeSections.length > 0 ? (
            activeSections.map((sec, idx) => (
              <div
                key={sec.title || idx}
                className="overflow-hidden rounded-xl border border-border/80 bg-card p-0 shadow-xs flex flex-col"
              >
                {(sec.title || sec.description) && (
                  <div className="flex flex-col gap-0.5 px-4 py-2.5 border-b border-border/60 bg-muted/20">
                    {sec.title && (
                      <div className="text-xs font-semibold tracking-tight text-foreground">
                        {sec.title}
                      </div>
                    )}
                    {sec.description && (
                      <p className="text-[11px] text-muted-foreground">
                        {sec.description}
                      </p>
                    )}
                  </div>
                )}
                <div className="p-4">
                  <FormFields
                    fields={sec.fields}
                    values={values}
                    onChange={handleFieldChange}
                    errors={errors}
                    columns={sec.columns || columns}
                  />
                </div>
              </div>
            ))
          ) : activeFields.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-border/80 bg-card p-4 shadow-xs">
              <FormFields
                fields={activeFields}
                values={values}
                onChange={handleFieldChange}
                errors={errors}
                columns={columns}
              />
            </div>
          ) : null}
        </>
      )}

      {typeof extraContent === "function" ? extraContent(values) : extraContent}

      {activeDetailConfig ? (
        <DetailTable<TItem>
          title={activeDetailConfig.title}
          description={activeDetailConfig.description}
          columns={activeDetailConfig.columns}
          data={items}
          onChange={isView ? undefined : handleItemsChange}
          onAddRow={activeDetailConfig.onAddRow}
          addText={activeDetailConfig.addText}
          minRows={activeDetailConfig.minRows}
          mode={isView ? "view" : activeDetailConfig.readOnly ? "view" : "edit"}
          readOnly={isView || Boolean(activeDetailConfig.readOnly)}
          emptyText={activeDetailConfig.emptyText}
          summary={activeDetailConfig.summary}
        />
      ) : null}
    </div>
  );

  if (inline) {
    return (
      <div
        className={cn(
          "flex flex-col gap-4 rounded-xl border border-border bg-card p-6 shadow-sm",
          activeDetailConfig && "max-w-5xl",
          className,
        )}
      >
        {brandHeader}
        {headerExtra}
        <div className="flex-1 overflow-y-auto">{body}</div>
        {renderedFooter}
      </div>
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => (next ? onOpenChange?.(true) : handleClose())}
    >
      <DialogContent
        className={cn(
          "flex max-h-[85vh] w-full max-w-2xl flex-col gap-4 p-6 sm:max-w-2xl",
          activeDetailConfig && "max-w-5xl sm:max-w-5xl",
          className,
        )}
      >
        <DialogHeader className="gap-2 text-left">
          <DialogTitle asChild>{brandHeader}</DialogTitle>
          <DialogDescription className="sr-only">
            {typeof renderedTitle === "string" ? renderedTitle : "表单详情"}
          </DialogDescription>
        </DialogHeader>

        {headerExtra}

        <div className="flex-1 overflow-y-auto px-1 py-1 -mx-1 -my-1">
          {body}
        </div>

        {renderedFooter}
      </DialogContent>
    </Dialog>
  );
}
