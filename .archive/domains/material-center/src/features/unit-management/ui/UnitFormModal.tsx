"use client";

import { useMemo } from "react";
import { FormModal, type FormFieldSchema, toast, z } from "@base/ui";
import { createUnitAction, updateUnitAction } from "../actions";
import type { UnitListItem } from "../types";

export interface UnitFormModalProps {
  readonly mode: "create" | "edit";
  readonly record?: UnitListItem | null;
  readonly onClose: () => void;
  readonly onSuccess?: () => void;
}

const unitFormZodSchema = z.object({
  unitCode: z.string().min(1, "单位编码不能为空"),
  unitName: z.string().min(1, "单位名称不能为空"),
  unitType: z.enum(["WEIGHT", "COUNT", "VOLUME"]),
  baseRatio: z.number().min(0.0001, "折算率必须大于 0"),
  isBaseUnit: z.boolean().default(false),
});

type UnitFormData = z.infer<typeof unitFormZodSchema>;

export function UnitFormModal({
  mode,
  record,
  onClose,
  onSuccess,
}: UnitFormModalProps) {
  const isEdit = mode === "edit";

  const initialValues: UnitFormData = useMemo(
    () => ({
      unitCode: record?.unitCode || "",
      unitName: record?.unitName || "",
      unitType: (record?.unitType as "WEIGHT" | "COUNT" | "VOLUME") || "WEIGHT",
      baseRatio: record?.baseRatio ?? 1,
      isBaseUnit: record?.isBaseUnit ?? false,
    }),
    [record],
  );

  const fields: FormFieldSchema[] = useMemo(
    () => [
      {
        name: "unitCode",
        label: "单位编码",
        type: "text" as const,
        required: true,
        disabled: isEdit,
        placeholder: "如: jin, kg, box",
        hint: isEdit ? "单位编码建档后不可更改" : undefined,
      },
      {
        name: "unitName",
        label: "单位名称",
        type: "text" as const,
        required: true,
        placeholder: "如: 斤、千克、箱",
      },
      {
        name: "unitType",
        label: "度量类别",
        type: "select" as const,
        required: true,
        options: [
          { value: "WEIGHT", label: "重量 (克基准)" },
          { value: "COUNT", label: "计件 (件基准)" },
          { value: "VOLUME", label: "体积 (毫升基准)" },
        ],
      },
      {
        name: "baseRatio",
        label: "相对基准折算率",
        type: "number" as const,
        required: true,
        hint: "以克/个/毫升为1，例如 1斤=500",
      },
      {
        name: "isBaseUnit",
        label: "是否设为基准单位",
        type: "checkbox" as const,
      },
    ],
    [isEdit],
  );

  return (
    <FormModal<UnitFormData>
      open
      onClose={onClose}
      mode={mode}
      title={isEdit ? `编辑计量单位: ${record?.unitName}` : "新增计量单位"}
      description="系统度量衡基准字典"
      schema={unitFormZodSchema}
      fields={fields}
      initialValues={initialValues}
      submitText={isEdit ? "保存修改" : "立即创建"}
      onSubmit={async (values) => {
        if (isEdit && record) {
          const res = await updateUnitAction({
            id: record.id,
            unitName: values.unitName,
            unitType: values.unitType,
            baseRatio: Number(values.baseRatio),
            isBaseUnit: values.isBaseUnit,
          });
          if (!res.success) {
            toast.error(res.error || "修改单位失败");
            throw new Error(res.error || "修改单位失败");
          }
          toast.success("计量单位更新成功");
        } else {
          const res = await createUnitAction({
            unitCode: values.unitCode,
            unitName: values.unitName,
            unitType: values.unitType,
            baseRatio: Number(values.baseRatio),
            isBaseUnit: values.isBaseUnit,
          });
          if (!res.success) {
            toast.error(res.error || "创建单位失败");
            throw new Error(res.error || "创建单位失败");
          }
          toast.success("新计量单位已创建");
        }
        onSuccess?.();
      }}
    />
  );
}
