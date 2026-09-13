"use client";

import React, { useState } from "react";
import { DataTable, Button, Badge, toast, type ColumnDef } from "@base/ui";
import { Plus, Tag, FolderTree } from "lucide-react";
import type { CategoryListItem, VarietyListItem } from "../types";
import {
  createCategoryAction,
  createVarietyAction,
  toggleVarietyStatusAction,
} from "../actions";

interface ClassificationViewProps {
  initialCategories: CategoryListItem[];
  initialVarieties: VarietyListItem[];
}

export function ClassificationView({
  initialCategories,
  initialVarieties,
}: ClassificationViewProps) {
  const [categories, setCategories] =
    useState<CategoryListItem[]>(initialCategories);
  const [varieties, setVarieties] =
    useState<VarietyListItem[]>(initialVarieties);
  const [activeTab, setActiveTab] = useState<"category" | "variety">(
    "category",
  );

  const [newCatCode, setNewCatCode] = useState("");
  const [newCatName, setNewCatName] = useState("");
  const [newVarCode, setNewVarCode] = useState("");
  const [newVarName, setNewVarName] = useState("");
  const [newVarDesc, setNewVarDesc] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreateCategory = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!newCatCode || !newCatName) return;
    setLoading(true);
    try {
      const res = await createCategoryAction({
        categoryCode: newCatCode,
        categoryName: newCatName,
        level: 1,
      });
      if (res.success && res.data) {
        setCategories((prev) => [
          ...prev,
          {
            id: res.data.id,
            categoryCode: res.data.categoryCode,
            categoryName: res.data.categoryName,
            parentId: null,
            parentName: null,
            level: res.data.level,
            sortOrder: res.data.sortOrder,
            status: res.data.status,
            createdAt: res.data.createdAt,
            updatedAt: res.data.updatedAt,
          },
        ]);
        setNewCatCode("");
        setNewCatName("");
        toast.success("分类添加成功");
      } else if (!res.success) {
        toast.error(res.error || "添加失败");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVariety = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!newVarCode || !newVarName) return;
    setLoading(true);
    try {
      const res = await createVarietyAction({
        varietyCode: newVarCode,
        varietyName: newVarName,
        description: newVarDesc,
      });
      if (res.success && res.data) {
        setVarieties((prev) => [
          ...prev,
          {
            id: res.data.id,
            varietyCode: res.data.varietyCode,
            varietyName: res.data.varietyName,
            description: res.data.description,
            status: res.data.status,
            createdAt: res.data.createdAt,
            updatedAt: res.data.updatedAt,
          },
        ]);
        setNewVarCode("");
        setNewVarName("");
        setNewVarDesc("");
        toast.success("品种添加成功");
      } else if (!res.success) {
        toast.error(res.error || "添加失败");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVariety = async (id: string, current: string) => {
    const targetStatus = current === "ACTIVE" ? "DISABLED" : "ACTIVE";
    const res = await toggleVarietyStatusAction({ id, targetStatus });
    if (res.success && res.data) {
      setVarieties((prev) =>
        prev.map((v) => (v.id === id ? { ...v, status: targetStatus } : v)),
      );
      toast.success("状态更新成功");
    } else if (!res.success) {
      toast.error(res.error || "状态更新失败");
    }
  };

  const categoryColumns: ColumnDef<CategoryListItem>[] = [
    {
      id: "categoryCode",
      header: "分类编码",
      cell: (row) => (
        <span className="font-mono text-xs">{row.categoryCode}</span>
      ),
    },
    {
      id: "categoryName",
      header: "分类名称",
      cell: (row) => <span className="font-medium">{row.categoryName}</span>,
    },
    {
      id: "level",
      header: "层级",
      cell: (row) => <span>{row.level === 1 ? "一级品类" : "二级分类"}</span>,
    },
    {
      id: "status",
      header: "状态",
      cell: (row) => (
        <Badge variant={row.status === "ACTIVE" ? "default" : "secondary"}>
          {row.status === "ACTIVE" ? "启用" : "停用"}
        </Badge>
      ),
    },
  ];

  const varietyColumns: ColumnDef<VarietyListItem>[] = [
    {
      id: "varietyCode",
      header: "品种编码",
      cell: (row) => (
        <span className="font-mono text-xs">{row.varietyCode}</span>
      ),
    },
    {
      id: "varietyName",
      header: "品种名称",
      cell: (row) => <span className="font-medium">{row.varietyName}</span>,
    },
    {
      id: "description",
      header: "说明",
      cell: (row) => (
        <span className="text-muted-foreground">{row.description || "-"}</span>
      ),
    },
    {
      id: "status",
      header: "状态",
      cell: (row) => (
        <Badge variant={row.status === "ACTIVE" ? "default" : "secondary"}>
          {row.status === "ACTIVE" ? "启用" : "停用"}
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
          onClick={() => handleToggleVariety(row.id, row.status)}
        >
          {row.status === "ACTIVE" ? "停用" : "启用"}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            品类与品种管理
          </h1>
          <p className="text-sm text-muted-foreground">
            维护生鲜净菜加工的一级品类、二级商品分类与独立生物品种档案
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant={activeTab === "category" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("category")}
          >
            <FolderTree className="mr-2 h-4 w-4" />
            商品分类树 ({categories.length})
          </Button>
          <Button
            variant={activeTab === "variety" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("variety")}
          >
            <Tag className="mr-2 h-4 w-4" />
            独立品种档案 ({varieties.length})
          </Button>
        </div>
      </div>

      {activeTab === "category" ? (
        <div className="space-y-4">
          <form
            onSubmit={handleCreateCategory}
            className="flex gap-2 items-center bg-muted/40 p-3 rounded-md"
          >
            <input
              type="text"
              placeholder="分类编码 (如 CAT-VEG)"
              value={newCatCode}
              onChange={(e) => setNewCatCode(e.target.value)}
              className="px-3 py-1.5 text-sm border rounded bg-background"
              required
            />
            <input
              type="text"
              placeholder="分类名称 (如 蔬菜、净菜加工)"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="px-3 py-1.5 text-sm border rounded bg-background"
              required
            />
            <Button type="submit" size="sm" disabled={loading}>
              <Plus className="mr-1 h-3.5 w-3.5" /> 添加分类
            </Button>
          </form>

          <DataTable
            data={categories}
            columns={categoryColumns}
            rowKey={(c) => c.id}
            title="商品分类树"
          />
        </div>
      ) : (
        <div className="space-y-4">
          <form
            onSubmit={handleCreateVariety}
            className="flex gap-2 items-center bg-muted/40 p-3 rounded-md"
          >
            <input
              type="text"
              placeholder="品种编码 (如 VAR-POTATO)"
              value={newVarCode}
              onChange={(e) => setNewVarCode(e.target.value)}
              className="px-3 py-1.5 text-sm border rounded bg-background"
              required
            />
            <input
              type="text"
              placeholder="品种名称 (如 土豆、青椒)"
              value={newVarName}
              onChange={(e) => setNewVarName(e.target.value)}
              className="px-3 py-1.5 text-sm border rounded bg-background"
              required
            />
            <input
              type="text"
              placeholder="描述 (选填)"
              value={newVarDesc}
              onChange={(e) => setNewVarDesc(e.target.value)}
              className="px-3 py-1.5 text-sm border rounded bg-background"
            />
            <Button type="submit" size="sm" disabled={loading}>
              <Plus className="mr-1 h-3.5 w-3.5" /> 添加品种
            </Button>
          </form>

          <DataTable
            data={varieties}
            columns={varietyColumns}
            rowKey={(v) => v.id}
            title="独立品种档案"
          />
        </div>
      )}
    </div>
  );
}
