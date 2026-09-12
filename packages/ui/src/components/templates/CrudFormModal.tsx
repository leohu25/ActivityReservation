"use client";

import React, { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { DataTableFormModal } from "../composite/data-table/DataTableFormModal";
import {
  DataTableFormFields,
  type DataTableFormFieldSchema,
} from "../composite/data-table/DataTableFormSchema";
import {
  DataTableFormSection,
  DataTableFormBanner,
} from "../composite/data-table/DataTableFormLayout";
import { toast } from "../feedback/Toast";

export type CrudFormMode = "create" | "edit" | "view";

export interface CrudFormModalProps<TValues extends Record<string, unknown>> {
  readonly open: boolean;
  readonly mode: CrudFormMode;
  readonly title?: string;
  readonly description?: string;
  readonly badge?: string;
  readonly bannerTitle?: string;
  readonly bannerDescription?: string;
  readonly fields: readonly DataTableFormFieldSchema[];
  readonly initialValues: TValues;
  /**
   * Zod 运行时校验规则（如 z.object({ ... })）。必填项！
   * 表单在输入修改与提交时统一执行 safeParse 运行时校验，
   * 失败时自动在对应字段下方呈现原生红字提示，并阻断无效提交。
   */
  readonly schema: z.ZodType<TValues> | z.ZodObject<any>;
  readonly onClose: () => void;
  readonly onSubmit?: (values: TValues) => Promise<void> | void;
  readonly submitText?: string;
  readonly cancelText?: string;
  readonly columns?: 2 | 3 | 4;
  readonly inline?: boolean;
}

/**
 * 通用 CRUD 三态（新增/编辑/查看）表单弹窗模板
 * 约定大于配置：基于 TypeScript + Zod Schema 真实运行时驱动
 * - mode === "view" 时全字段置灰只读，隐藏提交按钮
 * - mode === "edit" 时带入已有数据，支持部分唯一标识字段锁定
 * - mode === "create" 时开放可编辑并执行严格校验
 * - 当传入 schema 时，safeParse 失败自动标红拦截，阻止无效提交
 */
export function CrudFormModal<TValues extends Record<string, unknown>>({
  open,
  mode,
  title,
  description,
  badge = "CR",
  bannerTitle,
  bannerDescription,
  fields,
  initialValues,
  schema,
  onClose,
  onSubmit,
  submitText,
  cancelText = "取消",
  columns = 2,
  inline,
}: CrudFormModalProps<TValues>) {
  const [values, setValues] = useState<TValues>(initialValues);
  const [errors, setErrors] = useState<
    Partial<Record<keyof TValues & string, string>>
  >({});

  // 弹窗打开或初始数据变更时，重置表单与错误状态
  useEffect(() => {
    setValues(initialValues);
    setErrors({});
  }, [initialValues, open]);

  // 模式感知：只读态将所有字段设为 disabled
  const activeFields = useMemo(() => {
    if (mode === "view") {
      return fields.map((f) => ({ ...f, disabled: true }));
    }
    return fields;
  }, [fields, mode]);

  const defaultTitle =
    mode === "create" ? "新增记录" : mode === "edit" ? "编辑记录" : "查看详情";
  const defaultSubmitText = mode === "create" ? "立即创建" : "保存修改";

  // 字段值变更处理与错误即时重检
  const handleFieldChange = (name: keyof TValues & string, val: unknown) => {
    const nextValues = { ...values, [name]: val };
    setValues(nextValues);

    // 如果当前字段有报错，输入修改时自动重新执行 Zod safeParse 校验该字段
    if (errors[name]) {
      const res = schema.safeParse(nextValues);
      if (res.success) {
        setErrors({});
      } else {
        const stillHasIssue = res.error.issues.find((i) => i.path[0] === name);
        if (stillHasIssue) {
          setErrors((prev) => ({ ...prev, [name]: stillHasIssue.message }));
        } else {
          setErrors((prev) => {
            const next = { ...prev };
            delete next[name];
            return next;
          });
        }
      }
    }
  };

  // 提交校验与拦截：唯一主分支统一走 Zod safeParse 校验
  const handleSubmit = async () => {
    if (mode === "view") return;

    const parseResult = schema.safeParse(values);
    if (!parseResult.success) {
      const newErrors: Partial<Record<keyof TValues & string, string>> = {};
      for (const issue of parseResult.error.issues) {
        const fieldName = String(issue.path[0] ?? "");
        if (fieldName && !newErrors[fieldName as keyof TValues & string]) {
          newErrors[fieldName as keyof TValues & string] = issue.message;
        }
      }
      setErrors(newErrors);
      toast.error("表单数据校验未通过，请检查红字提示");
      return;
    }

    // 校验通过，执行业务提交
    setErrors({});
    try {
      await onSubmit?.(values);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "提交表单失败";
      toast.error(msg);
      throw err;
    }
  };

  return (
    <DataTableFormModal
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
      inline={inline}
      title={title || defaultTitle}
      description={description}
      badge={badge}
      submitText={submitText || defaultSubmitText}
      cancelText={mode === "view" ? "关闭" : cancelText}
      headerExtra={
        bannerTitle ? (
          <DataTableFormBanner
            title={bannerTitle}
            description={bannerDescription}
          />
        ) : undefined
      }
      onSubmit={mode === "view" ? undefined : handleSubmit}
    >
      <DataTableFormSection>
        <DataTableFormFields
          fields={activeFields}
          values={values}
          onChange={handleFieldChange}
          errors={errors}
          columns={columns}
        />
      </DataTableFormSection>
    </DataTableFormModal>
  );
}
