"use client";

import React, { useState } from "react";
import { DataTable, Button, Badge, toast, type ColumnDef } from "@base/ui";
import { Plus, Package, X } from "lucide-react";
import type { ItemMasterListItem } from "../types";
import { createItemMasterAction, toggleItemStatusAction } from "../actions";

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
  const [showModal, setShowModal] = useState(false);

  // 表单状态
  const [itemCode, setItemCode] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemCategory, setItemCategory] = useState<
    "RAW" | "SEMI_FINISHED" | "FINISHED" | "PACKAGING"
  >("RAW");
  const [categoryId, setCategoryId] = useState(categories[0]?.id || "");
  const [varietyId, setVarietyId] = useState(varieties[0]?.id || "");
  const [supplyMode, setSupplyMode] = useState<
    "PURCHASE" | "MANUFACTURE" | "HYBRID"
  >("PURCHASE");
  const [baseUnit, setBaseUnit] = useState(units[0]?.unitCode || "kg");
  const [purchaseUnit, setPurchaseUnit] = useState(units[0]?.unitCode || "kg");
  const [salesUnit, setSalesUnit] = useState(units[0]?.unitCode || "kg");
  const [qtyPrecision] = useState(2);
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await createItemMasterAction({
        itemCode,
        itemName,
        itemCategory,
        categoryId,
        varietyId: varietyId || null,
        supplyMode,
        baseUnit,
        purchaseUnit,
        salesUnit,
        stockUnit: baseUnit,
        qtyPrecision,
      });

      if (res.success && res.data) {
        const cat = categories.find((c) => c.id === categoryId);
        const varObj = varieties.find((v) => v.id === varietyId);
        setItems((prev) => [
          {
            id: res.data.id,
            itemCode: res.data.itemCode,
            itemName: res.data.itemName,
            itemAlias: null,
            pictureUrl: null,
            itemCategory: res.data.itemCategory,
            categoryId: res.data.categoryId,
            categoryName: cat?.categoryName || "-",
            varietyId: res.data.varietyId,
            varietyName: varObj?.varietyName || null,
            gradeId: null,
            gradeName: null,
            supplyMode: res.data.supplyMode,
            itemType: res.data.itemType,
            baseUnit: res.data.baseUnit,
            purchaseUnit: res.data.purchaseUnit,
            salesUnit: res.data.salesUnit,
            stockUnit: res.data.stockUnit,
            productionUnit: res.data.productionUnit,
            minPurchaseQty: null,
            minSalesQty: null,
            maxSalesQty: Number(res.data.maxSalesQty),
            qtyPrecision: res.data.qtyPrecision,
            shelfLifeHours: null,
            batchManaged: res.data.batchManaged,
            temperatureZone: null,
            processingForm: null,
            freshCutFlag: res.data.freshCutFlag,
            referencePrice: null,
            status: res.data.status,
            createdAt: res.data.createdAt,
            updatedAt: res.data.updatedAt,
          },
          ...prev,
        ]);
        setShowModal(false);
        setItemCode("");
        setItemName("");
        toast.success("商品档案创建成功");
      } else if (!res.success) {
        toast.error(res.error || "创建失败");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: string, current: string) => {
    const targetStatus = current === "ACTIVE" ? "DISCONTINUED" : "ACTIVE";
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

  const filteredItems =
    activeCategory === "ALL"
      ? items
      : items.filter((i) => i.itemCategory === activeCategory);

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
        <Badge variant={row.status === "ACTIVE" ? "default" : "secondary"}>
          {row.status === "ACTIVE" ? "在售" : "停售"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "操作",
      cell: (row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleToggleStatus(row.id, row.status)}
        >
          {row.status === "ACTIVE" ? "停售" : "启售"}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Package className="h-5 w-5" /> 商品档案主数据
          </h1>
          <p className="text-sm text-muted-foreground">
            涵盖原料、半成品、成品、包材四类物料，打通多单位换算、供应方式与工艺路线
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="mr-1 h-4 w-4" /> 新建商品
        </Button>
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
          <Button
            key={tab.key}
            variant={activeCategory === tab.key ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveCategory(tab.key)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      <DataTable
        data={filteredItems}
        columns={columns}
        rowKey={(i) => i.id}
        title="商品档案列表"
      />

      {/* 新建商品弹窗 */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background border rounded-lg max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-lg font-bold">新建商品档案</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  物料编码
                </label>
                <input
                  type="text"
                  placeholder="如 ITM202609001"
                  value={itemCode}
                  onChange={(e) => setItemCode(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border rounded bg-background"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  物料名称
                </label>
                <input
                  type="text"
                  placeholder="如 青椒段5cm、五花肉片"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border rounded bg-background"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    物料大类
                  </label>
                  <select
                    value={itemCategory}
                    onChange={(e) => setItemCategory(e.target.value as any)}
                    className="w-full px-3 py-1.5 text-sm border rounded bg-background"
                  >
                    <option value="RAW">原料</option>
                    <option value="SEMI_FINISHED">半成品</option>
                    <option value="FINISHED">成品</option>
                    <option value="PACKAGING">包材</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    供应方式
                  </label>
                  <select
                    value={supplyMode}
                    onChange={(e) => setSupplyMode(e.target.value as any)}
                    className="w-full px-3 py-1.5 text-sm border rounded bg-background"
                  >
                    <option value="PURCHASE">外购</option>
                    <option value="MANUFACTURE">自制</option>
                    <option value="HYBRID">自制为主可外购</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    商品分类
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border rounded bg-background"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.categoryName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    独立品种
                  </label>
                  <select
                    value={varietyId}
                    onChange={(e) => setVarietyId(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border rounded bg-background"
                  >
                    <option value="">未指定</option>
                    {varieties.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.varietyName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    基本核算单位
                  </label>
                  <select
                    value={baseUnit}
                    onChange={(e) => setBaseUnit(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border rounded bg-background"
                  >
                    {units.map((u) => (
                      <option key={u.id} value={u.unitCode}>
                        {u.unitName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    默认采购单位
                  </label>
                  <select
                    value={purchaseUnit}
                    onChange={(e) => setPurchaseUnit(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border rounded bg-background"
                  >
                    {units.map((u) => (
                      <option key={u.id} value={u.unitCode}>
                        {u.unitName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    默认销售单位
                  </label>
                  <select
                    value={salesUnit}
                    onChange={(e) => setSalesUnit(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border rounded bg-background"
                  >
                    {units.map((u) => (
                      <option key={u.id} value={u.unitCode}>
                        {u.unitName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
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
