"use client";

import React, { useState } from "react";
import { DataTable, Button, Badge, toast, type ColumnDef } from "@base/ui";
import { Plus, Scale } from "lucide-react";
import type { UnitListItem, UnitConversionListItem } from "../types";
import { createUnitAction, configureConversionAction } from "../actions";

interface UnitManagementViewProps {
  initialUnits: UnitListItem[];
  initialConversions: UnitConversionListItem[];
}

export function UnitManagementView({
  initialUnits,
  initialConversions,
}: UnitManagementViewProps) {
  const [units, setUnits] = useState<UnitListItem[]>(initialUnits);
  const [conversions, setConversions] =
    useState<UnitConversionListItem[]>(initialConversions);

  const [unitCode, setUnitCode] = useState("");
  const [unitName, setUnitName] = useState("");
  const [unitType, setUnitType] = useState<"WEIGHT" | "COUNT" | "VOLUME">(
    "WEIGHT",
  );
  const [baseRatio, setBaseRatio] = useState(1);
  const [isBaseUnit, setIsBaseUnit] = useState(false);
  const [loading, setLoading] = useState(false);

  // 专属换算表单
  const [itemCode, setItemCode] = useState("");
  const [fromUnitId, setFromUnitId] = useState("");
  const [toUnitId, setToUnitId] = useState("");
  const [conversionRate, setConversionRate] = useState(1);

  const handleCreateUnit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!unitCode || !unitName) return;
    setLoading(true);
    try {
      const res = await createUnitAction({
        unitCode,
        unitName,
        unitType,
        baseRatio,
        isBaseUnit,
      });
      if (res.success && res.data) {
        setUnits((prev) => [
          ...prev,
          {
            id: res.data.id,
            unitCode: res.data.unitCode,
            unitName: res.data.unitName,
            unitType: res.data.unitType,
            baseRatio: Number(res.data.baseRatio),
            isBaseUnit: res.data.isBaseUnit,
            status: res.data.status,
            createdAt: res.data.createdAt,
            updatedAt: res.data.updatedAt,
          },
        ]);
        setUnitCode("");
        setUnitName("");
        toast.success("计量单位添加成功");
      } else if (!res.success) {
        toast.error(res.error || "添加失败");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConversion = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!fromUnitId || !toUnitId || !conversionRate) return;
    setLoading(true);
    try {
      const res = await configureConversionAction({
        itemCode: itemCode || null,
        fromUnitId,
        toUnitId,
        conversionRate,
      });
      if (res.success && res.data) {
        const fromU = units.find((u) => u.id === fromUnitId);
        const toU = units.find((u) => u.id === toUnitId);
        setConversions((prev) => [
          ...prev,
          {
            id: res.data.id,
            itemCode: res.data.itemCode ?? null,
            fromUnitId: res.data.fromUnitId,
            fromUnitName: fromU?.unitName ?? res.data.fromUnitId,
            toUnitId: res.data.toUnitId,
            toUnitName: toU?.unitName ?? res.data.toUnitId,
            conversionRate: Number(res.data.conversionRate),
            createdAt: res.data.createdAt,
            updatedAt: res.data.updatedAt,
          },
        ]);
        setItemCode("");
        toast.success("换算规则配置成功");
      } else if (!res.success) {
        toast.error(res.error || "配置失败");
      }
    } finally {
      setLoading(false);
    }
  };

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
  ];

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          计量单位与多单位换算
        </h1>
        <p className="text-sm text-muted-foreground">
          支持重量、计件、体积分类度量基准，以及物料级专属换算规则（如：1件 =
          40斤）
        </p>
      </div>

      {/* 1. 计量单位定义 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Scale className="h-4 w-4" /> 计量单位字典
          </h2>
        </div>

        <form
          onSubmit={handleCreateUnit}
          className="flex gap-2 items-center bg-muted/40 p-3 rounded-md"
        >
          <input
            type="text"
            placeholder="单位编码 (如 jin)"
            value={unitCode}
            onChange={(e) => setUnitCode(e.target.value)}
            className="px-3 py-1.5 text-sm border rounded bg-background"
            required
          />
          <input
            type="text"
            placeholder="单位名称 (如 斤)"
            value={unitName}
            onChange={(e) => setUnitName(e.target.value)}
            className="px-3 py-1.5 text-sm border rounded bg-background"
            required
          />
          <select
            value={unitType}
            onChange={(e) => setUnitType(e.target.value as any)}
            className="px-3 py-1.5 text-sm border rounded bg-background"
          >
            <option value="WEIGHT">重量 (WEIGHT)</option>
            <option value="COUNT">计件 (COUNT)</option>
            <option value="VOLUME">体积 (VOLUME)</option>
          </select>
          <input
            type="number"
            step="0.0001"
            placeholder="基准比例 (如 500)"
            value={baseRatio}
            onChange={(e) => setBaseRatio(Number(e.target.value))}
            className="px-3 py-1.5 text-sm border rounded bg-background w-28"
            required
          />
          <label className="flex items-center gap-1 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={isBaseUnit}
              onChange={(e) => setIsBaseUnit(e.target.checked)}
            />
            设为基准
          </label>
          <Button type="submit" size="sm" disabled={loading}>
            <Plus className="mr-1 h-3.5 w-3.5" /> 添加单位
          </Button>
        </form>

        <DataTable
          data={units}
          columns={unitColumns}
          rowKey={(u) => u.id}
          title="系统单位字典"
        />
      </div>

      {/* 2. 物料专属换算规则 */}
      <div className="space-y-4 pt-4 border-t">
        <h2 className="text-base font-semibold">物料专属多单位换算规则</h2>

        <form
          onSubmit={handleCreateConversion}
          className="flex gap-2 items-center bg-muted/40 p-3 rounded-md"
        >
          <input
            type="text"
            placeholder="物料编码 (选填，为空代表全局)"
            value={itemCode}
            onChange={(e) => setItemCode(e.target.value)}
            className="px-3 py-1.5 text-sm border rounded bg-background"
          />
          <select
            value={fromUnitId}
            onChange={(e) => setFromUnitId(e.target.value)}
            className="px-3 py-1.5 text-sm border rounded bg-background"
            required
          >
            <option value="">选择源单位</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.unitName} ({u.unitCode})
              </option>
            ))}
          </select>
          <span className="text-sm text-muted-foreground">转为</span>
          <select
            value={toUnitId}
            onChange={(e) => setToUnitId(e.target.value)}
            className="px-3 py-1.5 text-sm border rounded bg-background"
            required
          >
            <option value="">选择目标单位</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.unitName} ({u.unitCode})
              </option>
            ))}
          </select>
          <input
            type="number"
            step="0.0001"
            placeholder="换算率 (如 40)"
            value={conversionRate}
            onChange={(e) => setConversionRate(Number(e.target.value))}
            className="px-3 py-1.5 text-sm border rounded bg-background w-28"
            required
          />
          <Button type="submit" size="sm" disabled={loading}>
            <Plus className="mr-1 h-3.5 w-3.5" /> 保存换算
          </Button>
        </form>

        <DataTable
          data={conversions}
          columns={conversionColumns}
          rowKey={(c) => c.id}
          title="多单位换算表"
        />
      </div>
    </div>
  );
}
