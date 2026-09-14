"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  DataTable,
  Button,
  Badge,
  DataTableRowActions,
  toast,
  type ColumnDef,
} from "@base/ui";
import { Layers, ExternalLink } from "lucide-react";
import type { BomListItem, ProcessTemplateItem } from "../types";
import { BomHeaderSubject } from "../contract";
import { publishBomAction, createNewBomVersionAction } from "../actions";
import { BomFlowEditorModal } from "./BomFlowEditorModal";

interface BomManagementViewProps {
  initialBoms: BomListItem[];
  productionLines: Array<{ id: string; lineName: string }>;
  items: Array<{ itemCode: string; itemName: string; baseUnit?: string }>;
  processTemplates?: ProcessTemplateItem[];
}

export function BomManagementView({
  initialBoms,
  productionLines,
  items,
  processTemplates = [],
}: BomManagementViewProps) {
  const [boms, setBoms] = useState<BomListItem[]>(initialBoms);
  const [activeType, setActiveType] = useState<string>("ALL");
  const [keyword, setKeyword] = useState("");
  const [showModal, setShowModal] = useState(false);

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

  const filteredBoms = boms.filter((b) => {
    if (activeType !== "ALL" && b.bomType !== activeType) {
      return false;
    }
    if (keyword.trim()) {
      const q = keyword.trim().toLowerCase();
      const codeMatch = b.bomCode.toLowerCase().includes(q);
      const nameMatch = b.bomName.toLowerCase().includes(q);
      const itemMatch =
        b.outputItemName.toLowerCase().includes(q) ||
        b.outputItemCode.toLowerCase().includes(q);
      if (!codeMatch && !nameMatch && !itemMatch) {
        return false;
      }
    }
    return true;
  });

  const columns: ColumnDef<BomListItem>[] = [
    {
      id: "bomCode",
      header: "BOM编码",
      cell: (row) => (
        <span className="font-mono text-xs font-semibold text-foreground">
          {row.bomCode}
        </span>
      ),
    },
    {
      id: "bomName",
      header: "BOM名称",
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-foreground">{row.bomName}</span>
          <Badge variant="outline" className="text-[10px] font-mono">
            {row.version}
          </Badge>
          {row.isResearch && (
            <Badge
              variant="secondary"
              className="text-[10px] bg-purple-50 text-purple-700 border-purple-200"
            >
              研发
            </Badge>
          )}
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
          SINGLE: { label: "单品初加工", variant: "secondary" },
          COMPOSITE: { label: "配方组合", variant: "default" },
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
          <span className="font-medium text-foreground">
            {row.outputItemName}
          </span>
          <span className="text-[10px] text-muted-foreground font-mono">
            {row.outputItemCode}
          </span>
        </div>
      ),
    },
    {
      id: "processCount",
      header: "工序数量",
      cell: (row) => (
        <span className="font-mono text-xs font-semibold text-foreground tabular-nums">
          {row.processCount || row.processes?.length || 0} 道工序
        </span>
      ),
    },
    {
      id: "productionLineName",
      header: "生产产线",
      cell: (row) => (
        <span className="text-xs text-muted-foreground">
          {row.productionLineName || "-"}
        </span>
      ),
    },
    {
      id: "totalYieldRate",
      header: "综合出成率",
      cell: (row) => (
        <span className="font-bold text-primary tabular-nums">
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
      width: 170,
      align: "right",
      cell: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Link href={`/materials/boms/${row.id}`}>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs cursor-pointer text-muted-foreground hover:text-primary"
            >
              <ExternalLink className="mr-1 h-3.5 w-3.5" /> 详情
            </Button>
          </Link>

          <DataTableRowActions
            record={row}
            hideView
            hideEdit
            hideDelete
            extraActions={[
              ...(row.status === "DRAFT"
                ? [
                    {
                      label: "发布",
                      onClick: () => handlePublish(row.id),
                    },
                  ]
                : []),
              ...(row.status === "ACTIVE"
                ? [
                    {
                      label: "另存新版",
                      onClick: () => handleCloneVersion(row.id, row.version),
                    },
                  ]
                : []),
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* 顶部标题栏 */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" /> 工艺BOM与工序流转中心
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            覆盖单品初加工、配方组合调理与定量包装三类工艺，支持工序节点有向图
            (DAG)、投入原料递归与综合出成率核算
          </p>
        </div>
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
            className="cursor-pointer"
            onClick={() => setActiveType(tab.key)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* BOM 基础清单表格 */}
      <DataTable
        data={filteredBoms}
        columns={columns}
        rowKey={(b) => b.id}
        subject={BomHeaderSubject}
        title="BOM 基础清单"
        description="系统全部工艺 BOM 方案及工序投入产出结构表"
        onCreate={() => setShowModal(true)}
        createText="编排工艺 BOM"
        keywordValue={keyword}
        keywordPlaceholder="按 BOM 编码、名称或产出商品搜索..."
        onKeywordChange={setKeyword}
        onSearch={() => {}}
        onReset={() => setKeyword("")}
        hideStatusFilter={true}
      />

      {/* 完整的工艺 BOM 与工序流转编排抽屉/模态窗 */}
      <BomFlowEditorModal
        open={showModal}
        onClose={() => setShowModal(false)}
        productionLines={productionLines}
        items={items}
        processTemplates={processTemplates}
        onSuccess={(createdBom) => {
          setBoms((prev) => [createdBom, ...prev]);
        }}
      />
    </div>
  );
}
