"use client";

import { useState } from "react";
import {
  DataTable,
  Badge,
  DataTableRowActions,
  toast,
  type ColumnDef,
} from "@base/ui";
import { Package } from "lucide-react";
import type { ItemMasterListItem } from "../types";
import { ItemMasterSubject } from "../contract";
import { toggleItemStatusAction, deleteItemMasterAction } from "../actions";
import { MasterDataStatus } from "@base/shared";
import { ItemMasterFormModal } from "./ItemMasterFormModal";

interface ItemMasterViewProps {
  initialItems: ItemMasterListItem[];
  categories: Array<{ id: string; categoryName: string }>;
  varieties: Array<{ id: string; varietyName: string }>;
  units: Array<{ id: string; unitCode: string; unitName: string }>;
}

export function ItemMasterView({
  initialItems,
  categories,
  varieties,
  units,
}: ItemMasterViewProps) {
  const [items, setItems] = useState<ItemMasterListItem[]>(initialItems);
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // 标准 FormModal 状态
  const [modalState, setModalState] = useState<{
    open: boolean;
    mode: "create" | "edit";
    record?: ItemMasterListItem | null;
  }>({ open: false, mode: "create", record: null });

  const handleToggleStatus = async (id: string, current: string) => {
    const targetStatus =
      current === MasterDataStatus.ACTIVE
        ? "DISCONTINUED"
        : MasterDataStatus.ACTIVE;
    const res = await toggleItemStatusAction({ id, targetStatus });
    if (res.success && res.data) {
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status: targetStatus } : i)),
      );
      toast.success("在售状态已更新");
    } else if (!res.success) {
      toast.error(res.error || "状态更新失败");
    }
  };

  const handleDeleteItem = async (id: string, name: string) => {
    try {
      const res = await deleteItemMasterAction({ id });
      if (res.success) {
        setItems((prev) => prev.filter((i) => i.id !== id));
        toast.success(`商品 [${name}] 已移入回收站`);
      } else {
        toast.error(res.error || "删除失败");
      }
    } catch {
      toast.error("删除商品异常");
    }
  };

  const filteredItems = items.filter((i) => {
    // 1. 大类筛选
    if (activeCategory !== "ALL" && i.itemCategory !== activeCategory) {
      return false;
    }
    // 2. 状态筛选
    if (statusFilter && i.status !== statusFilter) {
      return false;
    }
    // 3. 关键字搜索（按编码或名称）
    if (keyword.trim()) {
      const q = keyword.trim().toLowerCase();
      const codeMatch = i.itemCode.toLowerCase().includes(q);
      const nameMatch = i.itemName.toLowerCase().includes(q);
      if (!codeMatch && !nameMatch) {
        return false;
      }
    }
    return true;
  });

  const columns: ColumnDef<ItemMasterListItem>[] = [
    {
      id: "itemCode",
      header: "商品编码",
      cell: (row) => <span className="font-mono text-xs">{row.itemCode}</span>,
    },
    {
      id: "itemName",
      header: "商品名称",
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.itemName}</span>
          {row.varietyName && (
            <span className="text-xs text-muted-foreground">
              品种: {row.varietyName}
            </span>
          )}
        </div>
      ),
    },
    {
      id: "itemCategory",
      header: "物料大类",
      cell: (row) => {
        const catMap: Record<
          string,
          { label: string; variant: "default" | "secondary" | "outline" }
        > = {
          RAW: { label: "原料", variant: "outline" },
          SEMI_FINISHED: { label: "半成品", variant: "secondary" },
          FINISHED: { label: "成品", variant: "default" },
          PACKAGING: { label: "包材", variant: "outline" },
        };
        const conf = catMap[row.itemCategory] || {
          label: row.itemCategory,
          variant: "outline",
        };
        return <Badge variant={conf.variant}>{conf.label}</Badge>;
      },
    },
    {
      id: "categoryName",
      header: "商品分类",
      cell: (row) => <span>{row.categoryName}</span>,
    },
    {
      id: "units",
      header: "计量单位 (核算/采购/销售)",
      cell: (row) => (
        <span className="text-xs">
          {row.baseUnit} / {row.purchaseUnit} / {row.salesUnit || "-"}
        </span>
      ),
    },
    {
      id: "supplyMode",
      header: "供应方式",
      cell: (row) => {
        const modeMap: Record<string, string> = {
          PURCHASE: "外购",
          MANUFACTURE: "自制",
          HYBRID: "自制为主",
        };
        return <span>{modeMap[row.supplyMode] || row.supplyMode}</span>;
      },
    },
    {
      id: "status",
      header: "状态",
      cell: (row) => (
        <Badge
          variant={
            row.status === MasterDataStatus.ACTIVE ? "default" : "secondary"
          }
        >
          {row.status === MasterDataStatus.ACTIVE ? "在售" : "停售"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "操作",
      width: 170,
      align: "right",
      cell: (row) => (
        <DataTableRowActions
          record={row}
          hideView
          onEdit={() =>
            setModalState({ open: true, mode: "edit", record: row })
          }
          extraActions={[
            {
              label: row.status === MasterDataStatus.ACTIVE ? "停售" : "启售",
              onClick: () => handleToggleStatus(row.id, row.status),
            },
          ]}
          onDelete={() => handleDeleteItem(row.id, row.itemName)}
          deleteConfirm={{
            title: `确定删除商品 [${row.itemName}] 吗？`,
            description: "删除后该商品将移入回收站，不可再进行采购订货或流转。",
          }}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" /> 商品档案主数据
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          涵盖原料、半成品、成品、包材四类物料，打通多单位换算、供应方式与工艺路线
        </p>
      </div>

      {/* 大类筛选切换 */}
      <div className="flex space-x-2">
        {[
          { key: "ALL", label: "全部物料" },
          { key: "RAW", label: "原料 (毛料)" },
          { key: "SEMI_FINISHED", label: "半成品 (净菜中间品)" },
          { key: "FINISHED", label: "成品 (配送标品)" },
          { key: "PACKAGING", label: "包材辅料" },
        ].map((tab) => (
          <button
            type="button"
            key={tab.key}
            onClick={() => setActiveCategory(tab.key)}
            className={`px-3 py-1 text-xs rounded-md border cursor-pointer transition-colors ${
              activeCategory === tab.key
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-foreground border-border hover:bg-muted/50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <DataTable
        data={filteredItems}
        columns={columns}
        rowKey={(i) => i.id}
        subject={ItemMasterSubject}
        title="商品档案列表"
        description="系统全部物料商品档案主数据"
        onCreate={() =>
          setModalState({ open: true, mode: "create", record: null })
        }
        createText="新建商品"
        keywordPlaceholder="搜索商品编码、名称、拼音码、条码..."
        keywordValue={keyword}
        onKeywordChange={setKeyword}
        statusOptions={[
          { value: MasterDataStatus.ACTIVE, label: "在售/有效" },
          { value: "DISCONTINUED", label: "停售/停用" },
        ]}
        statusValue={statusFilter}
        onStatusChange={setStatusFilter}
        onSearch={() => {}}
        onReset={() => {
          setKeyword("");
          setStatusFilter("");
        }}
      />

      {/* 标准 FormModal */}
      {modalState.open && (
        <ItemMasterFormModal
          mode={modalState.mode}
          record={modalState.record}
          categories={categories}
          varieties={varieties}
          units={units}
          onClose={() =>
            setModalState({ open: false, mode: "create", record: null })
          }
          onSuccess={() => {
            setModalState({ open: false, mode: "create", record: null });
          }}
        />
      )}
    </div>
  );
}
