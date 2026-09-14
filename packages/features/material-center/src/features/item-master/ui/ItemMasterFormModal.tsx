"use client";

import { useMemo } from "react";
import { FormModal, type FormFieldSchema, toast, z } from "@base/ui";
import { createItemMasterAction, updateItemMasterAction } from "../actions";
import type { ItemMasterListItem } from "../types";

export interface ItemMasterFormModalProps {
  readonly mode: "create" | "edit";
  readonly record?: ItemMasterListItem | null;
  readonly categories: readonly { id: string; categoryName: string }[];
  readonly varieties: readonly { id: string; varietyName: string }[];
  readonly units: readonly { id: string; unitCode: string; unitName: string }[];
  readonly onClose: () => void;
  readonly onSuccess?: () => void;
}

const itemMasterFormZodSchema = z.object({
  itemCode: z.string().min(1, "商品编码不能为空"),
  itemName: z.string().min(1, "商品名称不能为空"),
  itemCategory: z.enum(["RAW", "SEMI_FINISHED", "FINISHED", "PACKAGING"]),
  categoryId: z.string().min(1, "请选择商品分类"),
  varietyId: z.string().optional(),
  supplyMode: z.enum(["PURCHASE", "MANUFACTURE", "HYBRID"]),
  baseUnit: z.string().min(1, "请选择核算基准单位"),
  purchaseUnit: z.string().min(1, "请选择采购单位"),
  salesUnit: z.string().optional(),
});

type ItemMasterFormData = z.infer<typeof itemMasterFormZodSchema>;

export function ItemMasterFormModal({
  mode,
  record,
  categories,
  varieties,
  units,
  onClose,
  onSuccess,
}: ItemMasterFormModalProps) {
  const isEdit = mode === "edit";

  const initialValues: ItemMasterFormData = useMemo(
    () => ({
      itemCode: record?.itemCode || "",
      itemName: record?.itemName || "",
      itemCategory:
        (record?.itemCategory as
          | "RAW"
          | "SEMI_FINISHED"
          | "FINISHED"
          | "PACKAGING") || "RAW",
      categoryId: record?.categoryId || categories[0]?.id || "",
      varietyId: record?.varietyId || "",
      supplyMode:
        (record?.supplyMode as "PURCHASE" | "MANUFACTURE" | "HYBRID") ||
        "PURCHASE",
      baseUnit: record?.baseUnit || units[0]?.unitCode || "kg",
      purchaseUnit: record?.purchaseUnit || units[0]?.unitCode || "kg",
      salesUnit: record?.salesUnit || units[0]?.unitCode || "kg",
    }),
    [record, categories, units],
  );

  const fields: FormFieldSchema[] = useMemo(
    () => [
      {
        name: "itemCode",
        label: "物料商品编码",
        type: "text" as const,
        required: true,
        disabled: isEdit,
        placeholder: "如: ITM202609001",
        hint: isEdit ? "物料编码建档后不可更改" : undefined,
      },
      {
        name: "itemName",
        label: "商品名称",
        type: "text" as const,
        required: true,
        placeholder: "如: 青椒段5cm、鲜切土豆丝",
      },
      {
        name: "itemCategory",
        label: "物料大类",
        type: "select" as const,
        required: true,
        options: [
          { value: "RAW", label: "原料 (毛料)" },
          { value: "SEMI_FINISHED", label: "半成品 (净菜加工中间品)" },
          { value: "FINISHED", label: "成品 (标品包装品)" },
          { value: "PACKAGING", label: "包材辅料" },
        ],
      },
      {
        name: "categoryId",
        label: "商品分类",
        type: "select" as const,
        required: true,
        options: categories.map((c) => ({
          value: c.id,
          label: c.categoryName,
        })),
      },
      {
        name: "varietyId",
        label: "关联生物品种 (选填)",
        type: "select" as const,
        options: [
          { value: "", label: "(无特定品种关联)" },
          ...varieties.map((v) => ({
            value: v.id,
            label: v.varietyName,
          })),
        ],
      },
      {
        name: "supplyMode",
        label: "供应方式",
        type: "select" as const,
        required: true,
        options: [
          { value: "PURCHASE", label: "外购" },
          { value: "MANUFACTURE", label: "自制" },
          { value: "HYBRID", label: "自制为主可外购" },
        ],
      },
      {
        name: "baseUnit",
        label: "库存核算基准单位",
        type: "select" as const,
        required: true,
        options: units.map((u) => ({
          value: u.unitCode,
          label: `${u.unitName} (${u.unitCode})`,
        })),
      },
      {
        name: "purchaseUnit",
        label: "采购结算单位",
        type: "select" as const,
        required: true,
        options: units.map((u) => ({
          value: u.unitCode,
          label: `${u.unitName} (${u.unitCode})`,
        })),
      },
      {
        name: "salesUnit",
        label: "销售配送单位",
        type: "select" as const,
        options: units.map((u) => ({
          value: u.unitCode,
          label: `${u.unitName} (${u.unitCode})`,
        })),
      },
    ],
    [isEdit, categories, varieties, units],
  );

  return (
    <FormModal<ItemMasterFormData>
      open
      onClose={onClose}
      mode={mode}
      title={isEdit ? `编辑商品档案: ${record?.itemName}` : "新建商品档案"}
      description="涵盖原料、半成品、成品、包材四类物料主数据"
      schema={itemMasterFormZodSchema}
      fields={fields}
      initialValues={initialValues}
      submitText={isEdit ? "保存修改" : "立即创建"}
      onSubmit={async (values) => {
        if (isEdit && record) {
          const res = await updateItemMasterAction({
            id: record.id,
            itemName: values.itemName,
            itemCategory: values.itemCategory,
            categoryId: values.categoryId,
            varietyId: values.varietyId || null,
            supplyMode: values.supplyMode,
            baseUnit: values.baseUnit,
            purchaseUnit: values.purchaseUnit,
            salesUnit: values.salesUnit || null,
          });
          if (!res.success) {
            toast.error(res.error || "更新商品档案失败");
            throw new Error(res.error || "更新商品档案失败");
          }
          toast.success("商品档案更新成功");
        } else {
          const res = await createItemMasterAction({
            itemCode: values.itemCode,
            itemName: values.itemName,
            itemCategory: values.itemCategory,
            categoryId: values.categoryId,
            varietyId: values.varietyId || null,
            supplyMode: values.supplyMode,
            baseUnit: values.baseUnit,
            purchaseUnit: values.purchaseUnit,
            salesUnit: values.salesUnit || null,
            stockUnit: values.baseUnit,
            qtyPrecision: 2,
          });
          if (!res.success) {
            toast.error(res.error || "创建商品档案失败");
            throw new Error(res.error || "创建商品档案失败");
          }
          toast.success("新商品档案已创建");
        }
        onSuccess?.();
      }}
    />
  );
}
