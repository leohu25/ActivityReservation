"use client";

import { useMemo } from "react";
import { FormModal, type FormFieldSchema, toast, z } from "@base/ui";
import { configureConversionAction } from "../actions";
import type { UnitConversionListItem, UnitListItem } from "../types";

export interface ConversionFormModalProps {
  readonly mode: "create" | "edit";
  readonly record?: UnitConversionListItem | null;
  readonly units: readonly UnitListItem[];
  readonly onClose: () => void;
  readonly onSuccess?: () => void;
}

const conversionFormZodSchema = z.object({
  itemCode: z.string().optional(),
  fromUnitId: z.string().min(1, "请选择源单位"),
  toUnitId: z.string().min(1, "请选择目标单位"),
  conversionRate: z.number().min(0.0001, "换算率必须大于 0"),
});

type ConversionFormData = z.infer<typeof conversionFormZodSchema>;

export function ConversionFormModal({
  mode,
  record,
  units,
  onClose,
  onSuccess,
}: ConversionFormModalProps) {
  const isEdit = mode === "edit";

  const initialValues: ConversionFormData = useMemo(
    () => ({
      itemCode: record?.itemCode || "",
      fromUnitId: record?.fromUnitId || units[0]?.id || "",
      toUnitId: record?.toUnitId || units[1]?.id || "",
      conversionRate: record?.conversionRate ?? 1,
    }),
    [record, units],
  );

  const unitOptions = useMemo(
    () =>
      units.map((u) => ({
        value: u.id,
        label: `${u.unitName} (${u.unitCode})`,
      })),
    [units],
  );

  const fields: FormFieldSchema[] = useMemo(
    () => [
      {
        name: "itemCode",
        label: "专属物料编码 (选填)",
        type: "text" as const,
        placeholder: "留空代表全局通用换算规则",
        hint: "如只针对土豆填 RAW-001，全局适用留空",
      },
      {
        name: "fromUnitId",
        label: "源单位",
        type: "select" as const,
        required: true,
        options: unitOptions,
      },
      {
        name: "toUnitId",
        label: "目标单位",
        type: "select" as const,
        required: true,
        options: unitOptions,
      },
      {
        name: "conversionRate",
        label: "换算比率 (目标数量 = 源数量 × 比率)",
        type: "number" as const,
        required: true,
        hint: "如 1件 = 40斤 则填 40",
      },
    ],
    [unitOptions],
  );

  return (
    <FormModal<ConversionFormData>
      open
      onClose={onClose}
      mode={mode}
      title={isEdit ? "编辑换算规则" : "配置单位换算规则"}
      description="特定物料专属或全局多单位换算比率"
      schema={conversionFormZodSchema}
      fields={fields}
      initialValues={initialValues}
      submitText={isEdit ? "保存修改" : "立即配置"}
      onSubmit={async (values) => {
        const res = await configureConversionAction({
          itemCode: values.itemCode?.trim() || null,
          fromUnitId: values.fromUnitId,
          toUnitId: values.toUnitId,
          conversionRate: Number(values.conversionRate),
        });
        if (!res.success) {
          toast.error(res.error || "配置换算规则失败");
          throw new Error(res.error || "配置换算规则失败");
        }
        toast.success("换算规则配置成功");
        onSuccess?.();
      }}
    />
  );
}
