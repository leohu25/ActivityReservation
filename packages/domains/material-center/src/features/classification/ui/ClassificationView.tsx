"use client";

import { useState, useMemo } from "react";
import {
  DataTable,
  Button,
  Badge,
  DataTableRowActions,
  toast,
  type ColumnDef,
} from "@base/ui";
import { FolderTree, Tag } from "lucide-react";
import type { CategoryListItem, VarietyListItem } from "../types";
import {
  ItemCategorySubject,
  ItemVarietySubject,
  itemCategorySearchContract,
  itemVarietySearchContract,
} from "../contract";
import { deleteCategoryAction, toggleVarietyStatusAction } from "../actions";
import { MasterDataStatus } from "@base/shared";
import { CategoryFormModal } from "./CategoryFormModal";
import { VarietyFormModal } from "./VarietyFormModal";

interface ClassificationViewProps {
  initialCategories?: CategoryListItem[] | null;
  initialVarieties?: VarietyListItem[] | null;
  canReadCategory?: boolean;
  canReadVariety?: boolean;
}

export function ClassificationView({
  initialCategories,
  initialVarieties,
  canReadCategory = true,
  canReadVariety = true,
}: ClassificationViewProps) {
  const [categories, setCategories] = useState<CategoryListItem[]>(
    initialCategories ?? [],
  );
  const [varieties, setVarieties] = useState<VarietyListItem[]>(
    initialVarieties ?? [],
  );
  const [activeTab, setActiveTab] = useState<"category" | "variety">(
    canReadCategory ? "category" : "variety",
  );

  // 搜索关键字状态
  const [catKeyword, setCatKeyword] = useState("");
  const [varKeyword, setVarKeyword] = useState("");

  // 标准 FormModal 状态
  const [catModal, setCatModal] = useState<{
    open: boolean;
    mode: "create" | "edit";
    record?: CategoryListItem | null;
  }>({ open: false, mode: "create", record: null });

  const [varModal, setVarModal] = useState<{
    open: boolean;
    mode: "create" | "edit";
    record?: VarietyListItem | null;
  }>({ open: false, mode: "create", record: null });

  const handleToggleVariety = async (id: string, current: string) => {
    const targetStatus =
      current === MasterDataStatus.ACTIVE
        ? MasterDataStatus.DISABLED
        : MasterDataStatus.ACTIVE;
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

  const handleDeleteCategory = async (id: string, name: string) => {
    try {
      const res = await deleteCategoryAction({ id });
      if (res.success) {
        setCategories((prev) => prev.filter((c) => c.id !== id));
        toast.success(`分类 [${name}] 已成功删除`);
      } else {
        toast.error(res.error || "删除分类失败");
      }
    } catch {
      toast.error("删除分类异常");
    }
  };

  // 客户端过滤分类
  const filteredCategories = useMemo(() => {
    const q = catKeyword.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter(
      (c) =>
        c.categoryCode.toLowerCase().includes(q) ||
        c.categoryName.toLowerCase().includes(q),
    );
  }, [categories, catKeyword]);

  // 客户端过滤品种
  const filteredVarieties = useMemo(() => {
    const q = varKeyword.trim().toLowerCase();
    if (!q) return varieties;
    return varieties.filter(
      (v) =>
        v.varietyCode.toLowerCase().includes(q) ||
        v.varietyName.toLowerCase().includes(q) ||
        (v.description && v.description.toLowerCase().includes(q)),
    );
  }, [varieties, varKeyword]);

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
        <Badge
          variant={
            row.status === MasterDataStatus.ACTIVE ? "default" : "secondary"
          }
        >
          {row.status === MasterDataStatus.ACTIVE ? "启用" : "停用"}
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
          onEdit={() => setCatModal({ open: true, mode: "edit", record: row })}
          onDelete={() => handleDeleteCategory(row.id, row.categoryName)}
          deleteConfirm={{
            title: `确定删除分类 [${row.categoryName}] 吗？`,
            description: "删除后该商品分类将移入回收站，不可继续关联新商品。",
          }}
        />
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
        <Badge
          variant={
            row.status === MasterDataStatus.ACTIVE ? "default" : "secondary"
          }
        >
          {row.status === MasterDataStatus.ACTIVE ? "启用" : "停用"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "操作",
      width: 140,
      align: "right",
      cell: (row) => (
        <DataTableRowActions
          record={row}
          hideView
          hideDelete
          extraActions={[
            {
              label: row.status === MasterDataStatus.ACTIVE ? "停用" : "启用",
              onClick: () => handleToggleVariety(row.id, row.status),
            },
          ]}
        />
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
          {canReadCategory && (
            <Button
              variant={activeTab === "category" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("category")}
            >
              <FolderTree className="mr-2 h-4 w-4" />
              商品分类树 ({categories.length})
            </Button>
          )}
          {canReadVariety && (
            <Button
              variant={activeTab === "variety" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("variety")}
            >
              <Tag className="mr-2 h-4 w-4" />
              独立品种档案 ({varieties.length})
            </Button>
          )}
        </div>
      </div>

      {activeTab === "category" ? (
        <div className="space-y-4">
          <DataTable
            data={filteredCategories}
            columns={categoryColumns}
            rowKey={(c) => c.id}
            subject={ItemCategorySubject}
            title="商品分类树"
            description="维护生鲜净菜加工的一二级商品分类"
            onCreate={() =>
              setCatModal({ open: true, mode: "create", record: null })
            }
            createText="新增分类"
            searchContract={itemCategorySearchContract}
            keywordValue={catKeyword}
            onKeywordChange={setCatKeyword}
            onSearch={() => {}}
            onReset={() => setCatKeyword("")}
            hideStatusFilter={true}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <DataTable
            data={filteredVarieties}
            columns={varietyColumns}
            rowKey={(v) => v.id}
            subject={ItemVarietySubject}
            title="独立品种档案"
            description="维护农产品、生鲜作物的独立生物品种与性状"
            onCreate={() =>
              setVarModal({ open: true, mode: "create", record: null })
            }
            createText="新增品种"
            searchContract={itemVarietySearchContract}
            keywordValue={varKeyword}
            onKeywordChange={setVarKeyword}
            onSearch={() => {}}
            onReset={() => setVarKeyword("")}
            hideStatusFilter={true}
          />
        </div>
      )}

      {/* 标准 FormModal：分类 */}
      {catModal.open && (
        <CategoryFormModal
          mode={catModal.mode}
          record={catModal.record}
          categories={categories}
          onClose={() =>
            setCatModal({ open: false, mode: "create", record: null })
          }
          onSuccess={() => {
            setCatModal({ open: false, mode: "create", record: null });
          }}
        />
      )}

      {/* 标准 FormModal：品种 */}
      {varModal.open && (
        <VarietyFormModal
          mode={varModal.mode}
          record={varModal.record}
          onClose={() =>
            setVarModal({ open: false, mode: "create", record: null })
          }
          onSuccess={() => {
            setVarModal({ open: false, mode: "create", record: null });
          }}
        />
      )}
    </div>
  );
}
