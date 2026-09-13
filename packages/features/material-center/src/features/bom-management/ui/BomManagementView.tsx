"use client";

import React, { useState } from "react";
import { DataTable, Button, Badge, toast, type ColumnDef } from "@base/ui";
import { Layers, Plus, CheckCircle2 } from "lucide-react";
import type { BomListItem } from "../types";
import {
  createBomAction,
  publishBomAction,
  createNewBomVersionAction,
} from "../actions";
import { BomVisualDag } from "./BomVisualDag";

interface BomManagementViewProps {
  initialBoms: BomListItem[];
  productionLines: Array<{ id: string; lineName: string }>;
  items: Array<{ itemCode: string; itemName: string }>;
}

export function BomManagementView({
  initialBoms,
  productionLines,
  items,
}: BomManagementViewProps) {
  const [boms, setBoms] = useState<BomListItem[]>(initialBoms);
  const [activeType, setActiveType] = useState<string>("ALL");
  const [showModal, setShowModal] = useState(false);
  const [selectedBomForDag, setSelectedBomForDag] =
    useState<BomListItem | null>(initialBoms[0] || null);

  // 表单状态
  const [bomCode, setBomCode] = useState("");
  const [bomName, setBomName] = useState("");
  const [bomType, setBomType] = useState<"SINGLE" | "COMPOSITE" | "PACKAGING">(
    "SINGLE",
  );
  const [outputItemCode, setOutputItemCode] = useState(
    items[0]?.itemCode || "",
  );
  const [batchQty, setBatchQty] = useState(1);
  const [batchUnit, setBatchUnit] = useState("kg");
  const [productionLineId, setProductionLineId] = useState(
    productionLines[0]?.id || "",
  );
  const [overrideTotalYield, setOverrideTotalYield] = useState(false);
  const [totalYieldRate, setTotalYieldRate] = useState<number | undefined>(
    undefined,
  );
  const [loading, setLoading] = useState(false);

  const handleCreateBom = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await createBomAction({
        bomCode,
        bomName,
        bomType,
        outputItemCode,
        batchQty,
        batchUnit,
        productionLineId: productionLineId || null,
        overrideTotalYield,
        totalYieldRate: totalYieldRate ?? null,
      });

      if (res.success && res.data) {
        const item = items.find((i) => i.itemCode === outputItemCode);
        const line = productionLines.find((l) => l.id === productionLineId);
        const newBom: BomListItem = {
          id: res.data.id,
          bomCode: res.data.bomCode,
          bomName: res.data.bomName,
          bomType: res.data.bomType,
          version: res.data.version,
          isResearch: res.data.isResearch,
          isDefault: res.data.isDefault,
          outputItemCode: res.data.outputItemCode,
          outputItemName: item?.itemName || res.data.outputItemCode,
          batchQty: Number(res.data.batchQty),
          batchUnit: res.data.batchUnit,
          productionLineId: res.data.productionLineId,
          productionLineName: line?.lineName || null,
          totalYieldRate: res.data.totalYieldRate
            ? Number(res.data.totalYieldRate)
            : null,
          overrideTotalYield: res.data.overrideTotalYield,
          processCount: 0,
          inputItemSummary: "-",
          status: res.data.status,
          effectiveDate: res.data.effectiveDate,
          updatedAt: res.data.updatedAt,
        };
        setBoms((prev) => [newBom, ...prev]);
        setShowModal(false);
        setBomCode("");
        setBomName("");
        toast.success("工艺BOM创建成功 (草稿)");
      } else if (!res.success) {
        toast.error(res.error || "创建失败");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (bomId: string) => {
    const res = await publishBomAction({ bomId });
    if (res.success && res.data) {
      setBoms((prev) =>
        prev.map((b) => (b.id === bomId ? { ...b, status: "ACTIVE" } : b)),
      );
      toast.success("BOM已发布，版本正式锁定生效");
    } else if (!res.success) {
      toast.error(res.error || "发布失败");
    }
  };

  const handleCloneVersion = async (
    sourceBomId: string,
    currentVersion: string,
  ) => {
    const nextVer = currentVersion === "V1.0" ? "V1.1" : `${currentVersion}.1`;
    const res = await createNewBomVersionAction({
      sourceBomId,
      newVersion: nextVer,
    });
    if (res.success && res.data) {
      toast.success(`已另存为新版本 ${nextVer}`);
    } else if (!res.success) {
      toast.error(res.error || "版本派生失败");
    }
  };

  const filteredBoms =
    activeType === "ALL" ? boms : boms.filter((b) => b.bomType === activeType);

  const columns: ColumnDef<BomListItem>[] = [
    {
      id: "bomCode",
      header: "BOM编码",
      cell: (row) => (
        <span
          className="font-mono text-xs font-semibold text-primary cursor-pointer hover:underline"
          onClick={() => setSelectedBomForDag(row)}
        >
          {row.bomCode}
        </span>
      ),
    },
    {
      id: "bomName",
      header: "BOM名称",
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          <span className="font-medium">{row.bomName}</span>
          <Badge variant="outline" className="text-[10px]">
            {row.version}
          </Badge>
        </div>
      ),
    },
    {
      id: "bomType",
      header: "BOM类型",
      cell: (row) => {
        const typeMap: Record<
          string,
          { label: string; variant: "default" | "secondary" | "outline" }
        > = {
          SINGLE: { label: "单品加工", variant: "secondary" },
          COMPOSITE: { label: "组合调理", variant: "default" },
          PACKAGING: { label: "定量包装", variant: "outline" },
        };
        const conf = typeMap[row.bomType] || {
          label: row.bomType,
          variant: "outline",
        };
        return <Badge variant={conf.variant}>{conf.label}</Badge>;
      },
    },
    {
      id: "outputItemName",
      header: "产出成品/半成品",
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.outputItemName}</span>
          <span className="text-[10px] text-muted-foreground font-mono">
            {row.outputItemCode}
          </span>
        </div>
      ),
    },
    {
      id: "productionLineName",
      header: "生产产线",
      cell: (row) => <span>{row.productionLineName || "-"}</span>,
    },
    {
      id: "totalYieldRate",
      header: "综合出成率",
      cell: (row) => (
        <span className="font-bold text-primary">
          {row.totalYieldRate ? `${row.totalYieldRate}%` : "100%"}
        </span>
      ),
    },
    {
      id: "status",
      header: "状态",
      cell: (row) => {
        const statusMap: Record<
          string,
          { label: string; variant: "default" | "secondary" | "outline" }
        > = {
          DRAFT: { label: "草稿", variant: "outline" },
          UNDER_REVIEW: { label: "评审中", variant: "secondary" },
          ACTIVE: { label: "已发布生效", variant: "default" },
          ARCHIVED: { label: "已归档", variant: "outline" },
        };
        const conf = statusMap[row.status] || {
          label: row.status,
          variant: "outline",
        };
        return <Badge variant={conf.variant}>{conf.label}</Badge>;
      },
    },
    {
      id: "actions",
      header: "操作",
      cell: (row) => (
        <div className="flex items-center gap-1">
          {row.status === "DRAFT" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePublish(row.id)}
            >
              <CheckCircle2 className="mr-1 h-3 w-3 text-emerald-600" /> 发布
            </Button>
          )}
          {row.status === "ACTIVE" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCloneVersion(row.id, row.version)}
            >
              另存新版
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Layers className="h-5 w-5" /> 工艺BOM管理
          </h1>
          <p className="text-sm text-muted-foreground">
            覆盖单品初加工、配方组合调理与定量包装三类BOM，支持综合出成率计算与发布版本控制
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="mr-1 h-4 w-4" /> 新建工艺BOM
        </Button>
      </div>

      {/* BOM 类型 Tabs 切换 */}
      <div className="flex space-x-2">
        {[
          { key: "ALL", label: "全部 BOM" },
          { key: "SINGLE", label: "单品 BOM (清洗切割)" },
          { key: "COMPOSITE", label: "组合 BOM (配方调理)" },
          { key: "PACKAGING", label: "包装 BOM (分装封口)" },
        ].map((tab) => (
          <Button
            key={tab.key}
            variant={activeType === tab.key ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveType(tab.key)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* 选中 BOM 的可视化 DAG 流程图预览 */}
      {selectedBomForDag && (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            当前选中 BOM 工艺流程预览
          </div>
          <BomVisualDag
            bomName={selectedBomForDag.bomName}
            bomCode={selectedBomForDag.bomCode}
            outputItemCode={selectedBomForDag.outputItemCode}
            totalYieldRate={selectedBomForDag.totalYieldRate}
            processes={[]}
          />
        </div>
      )}

      <DataTable
        data={filteredBoms}
        columns={columns}
        rowKey={(b) => b.id}
        title="BOM 基础清单"
      />

      {/* 新建 BOM 弹窗 */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background border rounded-lg max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-lg font-bold">新建工艺 BOM</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowModal(false)}
              >
                ✕
              </Button>
            </div>
            <form onSubmit={handleCreateBom} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  BOM 编号
                </label>
                <input
                  type="text"
                  placeholder="如 BOM-TDS-001"
                  value={bomCode}
                  onChange={(e) => setBomCode(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border rounded bg-background"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  BOM 名称
                </label>
                <input
                  type="text"
                  placeholder="如 土豆丝500g加工BOM"
                  value={bomName}
                  onChange={(e) => setBomName(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border rounded bg-background"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    BOM 类型
                  </label>
                  <select
                    value={bomType}
                    onChange={(e) => setBomType(e.target.value as any)}
                    className="w-full px-3 py-1.5 text-sm border rounded bg-background"
                  >
                    <option value="SINGLE">单品 BOM</option>
                    <option value="COMPOSITE">组合 BOM</option>
                    <option value="PACKAGING">包装 BOM</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    生产产线
                  </label>
                  <select
                    value={productionLineId}
                    onChange={(e) => setProductionLineId(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border rounded bg-background"
                  >
                    <option value="">未指定</option>
                    {productionLines.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.lineName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  产出目标商品
                </label>
                <select
                  value={outputItemCode}
                  onChange={(e) => setOutputItemCode(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border rounded bg-background"
                  required
                >
                  {items.map((i) => (
                    <option key={i.itemCode} value={i.itemCode}>
                      {i.itemName} ({i.itemCode})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    基准批量数量
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={batchQty}
                    onChange={(e) => setBatchQty(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-sm border rounded bg-background"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    批量单位
                  </label>
                  <input
                    type="text"
                    value={batchUnit}
                    onChange={(e) => setBatchUnit(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border rounded bg-background"
                    required
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="overrideYield"
                  checked={overrideTotalYield}
                  onChange={(e) => setOverrideTotalYield(e.target.checked)}
                />
                <label
                  htmlFor="overrideYield"
                  className="text-xs font-medium cursor-pointer"
                >
                  强行设定综合出成率 (忽略工序连乘)
                </label>
              </div>
              {overrideTotalYield && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    设定总出成率 (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="如 85.5"
                    value={totalYieldRate ?? ""}
                    onChange={(e) => setTotalYieldRate(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-sm border rounded bg-background"
                  />
                </div>
              )}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setShowModal(false)}
                >
                  取消
                </Button>
                <Button type="submit" disabled={loading}>
                  确认创建
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
