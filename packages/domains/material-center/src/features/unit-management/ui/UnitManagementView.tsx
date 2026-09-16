"use client";

import { useState, useMemo } from "react";
import {
  DataTable,
  Badge,
  DataTableRowActions,
  toast,
  type ColumnDef,
} from "@base/ui";
import { Scale } from "lucide-react";
import type { UnitListItem, UnitConversionListItem } from "../types";
import { UnitOfMeasureSubject, UnitConversionSubject } from "../contract";
import { deleteUnitAction, deleteConversionAction } from "../actions";
import { UnitFormModal } from "./UnitFormModal";
import { ConversionFormModal } from "./ConversionFormModal";

interface UnitManagementViewProps {
  initialUnits?: UnitListItem[] | null;
  initialConversions?: UnitConversionListItem[] | null;
  canReadUnit?: boolean;
  canReadConversion?: boolean;
}

export function UnitManagementView({
  initialUnits,
  initialConversions,
  canReadUnit = true,
  canReadConversion = true,
}: UnitManagementViewProps) {
  const [units, setUnits] = useState<UnitListItem[]>(initialUnits ?? []);
  const [conversions, setConversions] = useState<UnitConversionListItem[]>(
    initialConversions ?? [],
  );

  // 搜索关键字状态
  const [unitKeyword, setUnitKeyword] = useState("");
  const [convKeyword, setConvKeyword] = useState("");

  // 标准 FormModal 状态
  const [unitModal, setUnitModal] = useState<{
    open: boolean;
    mode: "create" | "edit";
    record?: UnitListItem | null;
  }>({ open: false, mode: "create", record: null });

  const [convModal, setConvModal] = useState<{
    open: boolean;
    mode: "create" | "edit";
    record?: UnitConversionListItem | null;
  }>({ open: false, mode: "create", record: null });

  const handleDeleteUnit = async (id: string, name: string) => {
    try {
      const res = await deleteUnitAction({ id });
      if (res.success) {
        setUnits((prev) => prev.filter((u) => u.id !== id));
        toast.success(`单位 [${name}] 已成功删除`);
      } else {
        toast.error(res.error || "删除单位失败");
      }
    } catch {
      toast.error("删除单位异常");
    }
  };

  const handleDeleteConversion = async (id: string) => {
    try {
      const res = await deleteConversionAction({ id });
      if (res.success) {
        setConversions((prev) => prev.filter((c) => c.id !== id));
        toast.success("换算规则已成功删除");
      } else {
        toast.error(res.error || "删除换算失败");
      }
    } catch {
      toast.error("删除换算异常");
    }
  };

  // 客户端过滤单位
  const filteredUnits = useMemo(() => {
    const q = unitKeyword.trim().toLowerCase();
    if (!q) return units;
    return units.filter(
      (u) =>
        u.unitCode.toLowerCase().includes(q) ||
        u.unitName.toLowerCase().includes(q),
    );
  }, [units, unitKeyword]);

  // 客户端过滤换算规则
  const filteredConversions = useMemo(() => {
    const q = convKeyword.trim().toLowerCase();
    if (!q) return conversions;
    return conversions.filter(
      (c) =>
        (c.itemCode && c.itemCode.toLowerCase().includes(q)) ||
        c.fromUnitName.toLowerCase().includes(q) ||
        c.toUnitName.toLowerCase().includes(q),
    );
  }, [conversions, convKeyword]);

  const unitColumns: ColumnDef<UnitListItem>[] = [
    {
      id: "unitCode",
      header: "单位编码",
      cell: (row) => <span className="font-mono text-xs">{row.unitCode}</span>,
    },
    {
      id: "unitName",
      header: "单位名称",
      cell: (row) => <span className="font-medium">{row.unitName}</span>,
    },
    {
      id: "unitType",
      header: "度量类型",
      cell: (row) => {
        const typeMap: Record<string, string> = {
          WEIGHT: "重量 (克基准)",
          COUNT: "计件 (件基准)",
          VOLUME: "体积 (毫升基准)",
        };
        return <span>{typeMap[row.unitType] || row.unitType}</span>;
      },
    },
    {
      id: "baseRatio",
      header: "相对基准折算率",
      cell: (row) => <span>{row.baseRatio}</span>,
    },
    {
      id: "isBaseUnit",
      header: "基准单位",
      cell: (row) => (
        <Badge variant={row.isBaseUnit ? "default" : "outline"}>
          {row.isBaseUnit ? "基准" : "辅助"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "操作",
      width: 130,
      align: "right",
      cell: (row) => (
        <DataTableRowActions
          record={row}
          hideView
          onEdit={() => setUnitModal({ open: true, mode: "edit", record: row })}
          onDelete={() => handleDeleteUnit(row.id, row.unitName)}
          deleteConfirm={{
            title: `确定删除单位 [${row.unitName}] 吗？`,
            description: "删除后该计量单位将不可在商品档案或单据中选择。",
          }}
        />
      ),
    },
  ];

  const conversionColumns: ColumnDef<UnitConversionListItem>[] = [
    {
      id: "itemCode",
      header: "专属物料编码",
      cell: (row) => (
        <span className="font-mono text-xs">{row.itemCode || "全局通用"}</span>
      ),
    },
    {
      id: "fromUnitName",
      header: "源单位",
      cell: (row) => <span>{row.fromUnitName}</span>,
    },
    {
      id: "toUnitName",
      header: "目标单位",
      cell: (row) => <span>{row.toUnitName}</span>,
    },
    {
      id: "conversionRate",
      header: "换算比率 (toQty = fromQty * rate)",
      cell: (row) => (
        <span className="font-semibold">{row.conversionRate}</span>
      ),
    },
    {
      id: "actions",
      header: "操作",
      width: 90,
      align: "right",
      cell: (row) => (
        <DataTableRowActions
          record={row}
          hideView
          hideEdit
          onDelete={() => handleDeleteConversion(row.id)}
          deleteConfirm={{
            title: "确定删除此换算规则吗？",
            description: "删除后系统将按基准单位折算或不再支持自动折算。",
          }}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Scale className="h-5 w-5 text-primary" />
          计量单位与多单位换算
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          支持重量、计件、体积分类度量基准，以及物料级专属换算规则（如：1件 =
          40斤）
        </p>
      </div>

      {/* 1. 计量单位定义 */}
      {canReadUnit && (
        <div className="space-y-4">
          <DataTable
            data={filteredUnits}
            columns={unitColumns}
            rowKey={(u) => u.id}
            subject={UnitOfMeasureSubject}
            title="系统单位字典"
            description="系统度量衡基准字典"
            onCreate={() =>
              setUnitModal({ open: true, mode: "create", record: null })
            }
            createText="新增单位"
            keywordValue={unitKeyword}
            keywordPlaceholder="按单位名称或编码搜索..."
            onKeywordChange={setUnitKeyword}
            onSearch={() => {}}
            onReset={() => setUnitKeyword("")}
            hideStatusFilter={true}
          />
        </div>
      )}

      {/* 2. 物料专属换算规则 */}
      {canReadConversion && (
        <div className="space-y-4 pt-4 border-t border-border">
          <DataTable
            data={filteredConversions}
            columns={conversionColumns}
            rowKey={(c) => c.id}
            subject={UnitConversionSubject}
            title="多单位换算表"
            description="特定物料或全局多单位换算公式"
            onCreate={() =>
              setConvModal({ open: true, mode: "create", record: null })
            }
            createText="新增换算规则"
            keywordValue={convKeyword}
            keywordPlaceholder="按物料编码或单位名称搜索..."
            onKeywordChange={setConvKeyword}
            onSearch={() => {}}
            onReset={() => setConvKeyword("")}
            hideStatusFilter={true}
          />
        </div>
      )}

      {/* 标准 FormModal：计量单位 */}
      {unitModal.open && (
        <UnitFormModal
          mode={unitModal.mode}
          record={unitModal.record}
          onClose={() =>
            setUnitModal({ open: false, mode: "create", record: null })
          }
          onSuccess={() => {
            setUnitModal({ open: false, mode: "create", record: null });
          }}
        />
      )}

      {/* 标准 FormModal：换算规则 */}
      {convModal.open && (
        <ConversionFormModal
          mode={convModal.mode}
          record={convModal.record}
          units={units}
          onClose={() =>
            setConvModal({ open: false, mode: "create", record: null })
          }
          onSuccess={() => {
            setConvModal({ open: false, mode: "create", record: null });
          }}
        />
      )}
    </div>
  );
}
