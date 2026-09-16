"use client";

import { useState, useEffect, useMemo } from "react";
import { MasterDataStatus } from "@base/shared";
import { StandardAction, useAbility } from "@base/authorization";
import {
  CustomerCategorySubject,
  CustomerTagSubject,
  customerTagPageContract,
} from "../contract";
import { Edit2, Trash2, FolderTree, Tag as TagIcon, Plus } from "lucide-react";
import {
  Card,
  Badge,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  ConfirmDialog,
  DataTree,
  type HierarchyNodeData,
  DataTable,
  type ColumnDef,
  DataTableRowActions,
  toast,
  useSafeRouter,
} from "@base/ui";
import {
  updateCategoryStatusAction,
  deleteCategoryAction,
  updateTagStatusAction,
  deleteTagAction,
} from "../actions";
import { CategoryFormModal } from "./CategoryFormModal";
import { TagFormModal } from "./TagFormModal";
import { customerTagSearchContract } from "../contract";
import type { CustomerCategoryItem, CustomerTagItem } from "../types";

/** 递归统计分类树所有节点总数 */
function countTreeNodes(nodes: CustomerCategoryItem[]): number {
  let count = 0;
  for (const node of nodes) {
    count += 1;
    if (node.children && node.children.length > 0) {
      count += countTreeNodes(node.children);
    }
  }
  return count;
}

/** 标签类型语义字典映射 */
const tagTypeLabels: Record<string, string> = {
  DELIVERY: "配送策略",
  SETTLEMENT: "结算方式",
  CREDIT: "信用分级",
  OTHER: "其他通用",
};

interface CategoryTagViewProps {
  readonly initialCategories?: CustomerCategoryItem[] | null;
  readonly initialTags?: CustomerTagItem[] | null;
  readonly canReadCategory?: boolean;
  readonly canReadTag?: boolean;
}

export interface CategoryTreeItem extends HierarchyNodeData {
  id: string;
  name: string;
  code: string;
  categoryCode: string;
  categoryName: string;
  parentCode: string | null;
  description: string | null;
  status: MasterDataStatus;
  children?: CategoryTreeItem[];
}

export function CategoryTagView({
  initialCategories,
  initialTags,
  canReadCategory = true,
  canReadTag = true,
}: CategoryTagViewProps) {
  const ability = useAbility();
  const router = useSafeRouter();

  // 权限位收敛（CASL Fail-Closed）
  const canCreateTag = ability.can(StandardAction.CREATE, CustomerTagSubject);
  const canUpdateTag = ability.can(StandardAction.UPDATE, CustomerTagSubject);
  const canDeleteTag = ability.can(StandardAction.DELETE, CustomerTagSubject);

  const [categories, setCategories] = useState<CustomerCategoryItem[]>(
    initialCategories ?? [],
  );
  const [tags, setTags] = useState<CustomerTagItem[]>(initialTags ?? []);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setCategories(initialCategories ?? []);
  }, [initialCategories]);

  useEffect(() => {
    setTags(initialTags ?? []);
  }, [initialTags]);

  const hasBoth = canReadCategory && canReadTag;
  const defaultTab = hasBoth ? "all" : canReadTag ? "tags" : "categories";
  const [activeTab, setActiveTab] = useState(defaultTab);

  // 搜索关键字
  const [catKeyword, setCatKeyword] = useState("");
  const [tagKeyword, setTagKeyword] = useState("");
  const [tagTypeFilter, setTagTypeFilter] = useState<string>("ALL");

  // 待删除分类状态（由 ConfirmDialog 驱动）
  const [deletingCat, setDeletingCat] = useState<CustomerCategoryItem | null>(
    null,
  );
  // 待删除标签状态（由 ConfirmDialog 驱动）
  const [deletingTag, setDeletingTag] = useState<CustomerTagItem | null>(null);

  // 分类弹窗状态
  const [catModal, setCatModal] = useState<{
    open: boolean;
    mode: "create" | "edit";
    record?: CustomerCategoryItem | null;
    defaultParentCode?: string | null;
  }>({ open: false, mode: "create", record: null, defaultParentCode: null });

  // 标签弹窗状态
  const [tagModal, setTagModal] = useState<{
    open: boolean;
    mode: "create" | "edit";
    record?: CustomerTagItem | null;
  }>({ open: false, mode: "create", record: null });

  // --- 分类操作 ---
  const handleToggleCatStatus = async (code: string, currentStatus: string) => {
    setLoading(true);
    const nextStatus =
      currentStatus === MasterDataStatus.ACTIVE
        ? MasterDataStatus.DISABLED
        : MasterDataStatus.ACTIVE;
    try {
      const res = await updateCategoryStatusAction(code, nextStatus);
      if (res.success) {
        toast.success(
          nextStatus === MasterDataStatus.ACTIVE ? "分类已启用" : "分类已停用",
        );
        router?.refresh();
      } else {
        toast.error(res.error || "变更状态失败");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "操作异常");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDeleteCat = async () => {
    if (!deletingCat) return;
    const code = deletingCat.categoryCode;
    setLoading(true);
    try {
      const res = await deleteCategoryAction(code);
      if (res.success) {
        toast.success("分类已成功删除");
        router?.refresh();
      } else {
        toast.error(res.error || "删除分类失败");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "删除分类异常");
    } finally {
      setLoading(false);
      setDeletingCat(null);
    }
  };

  // --- 标签操作 ---
  const handleToggleTagStatus = async (code: string, currentStatus: string) => {
    setLoading(true);
    const nextStatus =
      currentStatus === MasterDataStatus.ACTIVE
        ? MasterDataStatus.DISABLED
        : MasterDataStatus.ACTIVE;
    try {
      const res = await updateTagStatusAction(code, nextStatus);
      if (res.success) {
        setTags((prev) =>
          prev.map((t) =>
            t.tagCode === code ? { ...t, status: nextStatus } : t,
          ),
        );
        toast.success(
          nextStatus === MasterDataStatus.ACTIVE ? "标签已启用" : "标签已停用",
        );
        router?.refresh();
      } else {
        toast.error(res.error || "变更状态失败");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "操作异常");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDeleteTag = async () => {
    if (!deletingTag) return;
    const code = deletingTag.tagCode;
    setLoading(true);
    try {
      const res = await deleteTagAction(code);
      if (res.success) {
        setTags((prev) => prev.filter((t) => t.tagCode !== code));
        toast.success("标签已成功删除");
        router?.refresh();
      } else {
        toast.error(res.error || "删除标签失败");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "删除标签异常");
    } finally {
      setLoading(false);
      setDeletingTag(null);
    }
  };

  const totalCatCount = countTreeNodes(categories);

  const adaptCategoryTree = (
    items: CustomerCategoryItem[],
  ): CategoryTreeItem[] => {
    return items.map((it) => ({
      id: it.categoryCode,
      code: it.categoryCode,
      name: it.categoryName,
      categoryCode: it.categoryCode,
      categoryName: it.categoryName,
      parentCode: it.parentCode ?? null,
      description: it.description ?? null,
      status: it.status ?? MasterDataStatus.ACTIVE,
      children: it.children ? adaptCategoryTree(it.children) : undefined,
    }));
  };

  const adaptedTreeData = adaptCategoryTree(categories);

  const filteredTags = useMemo(() => {
    return tags.filter((t) => {
      const matchKeyword = tagKeyword
        ? (() => {
            const kw = tagKeyword.toLowerCase();
            return (
              t.tagCode.toLowerCase().includes(kw) ||
              t.tagName.toLowerCase().includes(kw) ||
              (t.description && t.description.toLowerCase().includes(kw))
            );
          })()
        : true;

      const matchType =
        tagTypeFilter === "ALL" || !tagTypeFilter
          ? true
          : t.tagType === tagTypeFilter;

      return matchKeyword && matchType;
    });
  }, [tags, tagKeyword, tagTypeFilter]);

  const tagColumns: ColumnDef<CustomerTagItem>[] = useMemo(
    () => [
      {
        id: "tagCode",
        header: "标签编码",
        width: 140,
        cell: (t: CustomerTagItem) => (
          <span className="font-mono text-xs font-semibold text-foreground">
            {t.tagCode}
          </span>
        ),
      },
      {
        id: "tagName",
        header: "标签名称",
        width: 160,
        cell: (t: CustomerTagItem) => (
          <span className="font-medium text-foreground">{t.tagName}</span>
        ),
      },
      {
        id: "tagType",
        header: "业务类型",
        width: 120,
        cell: (t: CustomerTagItem) => (
          <Badge variant="outline" size="sm" className="text-[11px]">
            {tagTypeLabels[t.tagType || ""] || t.tagType || "未定义"}
          </Badge>
        ),
      },
      {
        id: "description",
        header: "描述说明",
        cell: (t: CustomerTagItem) => (
          <span className="text-xs text-muted-foreground truncate max-w-[240px] block">
            {t.description || "-"}
          </span>
        ),
      },
      {
        id: "status",
        header: "状态",
        width: 90,
        align: "center",
        cell: (t: CustomerTagItem) => {
          const isActive = t.status === MasterDataStatus.ACTIVE;
          return (
            <Badge
              variant={isActive ? "success" : "secondary"}
              size="sm"
              className="text-[11px]"
            >
              {isActive ? "启用" : "停用"}
            </Badge>
          );
        },
      },
      {
        id: "actions",
        header: "操作",
        width: 110,
        align: "right",
        cell: (t: CustomerTagItem) => {
          const isActive = t.status === MasterDataStatus.ACTIVE;
          return (
            <DataTableRowActions
              record={t}
              onEdit={
                canUpdateTag
                  ? () =>
                      setTagModal({
                        open: true,
                        mode: "edit",
                        record: t,
                      })
                  : undefined
              }
              onDelete={canDeleteTag ? () => setDeletingTag(t) : undefined}
              deleteConfirm={{
                title: `确认删除业务标签 "${t.tagName}"？`,
                description: `删除后编码为 ${t.tagCode} 的标签将彻底移除，客户关联将被解除。`,
                confirmText: "确认删除",
                cancelText: "取消",
              }}
              extraActions={
                canUpdateTag
                  ? [
                      {
                        label: isActive ? "停用" : "启用",
                        action: StandardAction.UPDATE,
                        onClick: () =>
                          handleToggleTagStatus(
                            t.tagCode,
                            t.status || MasterDataStatus.ACTIVE,
                          ),
                      },
                    ]
                  : []
              }
            />
          );
        },
      },
    ],
    [canUpdateTag, canDeleteTag, loading],
  );

  const categorySection = (
    <DataTree<CategoryTreeItem>
      subject={CustomerCategorySubject}
      title="客户多级分类树"
      description={`按行业/业态构建树状体系（总计 ${totalCatCount} 个分类节点）`}
      data={adaptedTreeData}
      searchValue={catKeyword}
      onSearchChange={setCatKeyword}
      createRootText="新增一级根分类"
      emptyText="暂无分类数据，点击上方按钮创建第一条根分类"
      onCreateRoot={() =>
        setCatModal({
          open: true,
          mode: "create",
          record: null,
          defaultParentCode: null,
        })
      }
      renderExtra={(node) => {
        const isActive = node.status === MasterDataStatus.ACTIVE;
        return (
          <div className="inline-flex items-center gap-2">
            <Badge
              variant={isActive ? "success" : "secondary"}
              size="sm"
              className="text-[11px]"
            >
              {isActive ? "启用" : "停用"}
            </Badge>
            {node.description && (
              <span className="hidden sm:inline truncate text-xs text-muted-foreground max-w-[200px]">
                {node.description}
              </span>
            )}
          </div>
        );
      }}
      nodeActions={[
        {
          key: "add-child",
          action: StandardAction.CREATE,
          label: "下级",
          icon: <Plus className="size-3" />,
          variant: "outline",
          className:
            "h-7 px-2 text-xs border-dashed text-primary hover:bg-primary/5 hover:text-primary",
          onClick: (node) =>
            setCatModal({
              open: true,
              mode: "create",
              record: null,
              defaultParentCode: node.categoryCode,
            }),
        },
        {
          key: "edit-cat",
          action: StandardAction.UPDATE,
          label: "编辑",
          icon: <Edit2 className="size-3" />,
          className:
            "h-7 px-2 text-xs text-muted-foreground hover:text-foreground",
          onClick: (node) =>
            setCatModal({
              open: true,
              mode: "edit",
              record: node,
              defaultParentCode: null,
            }),
        },
        {
          key: "toggle-status",
          action: StandardAction.UPDATE,
          label: (node) =>
            node.status === MasterDataStatus.ACTIVE ? "停用" : "启用",
          className: "h-7 px-2 text-xs",
          onClick: (node) =>
            handleToggleCatStatus(node.categoryCode, node.status || "ACTIVE"),
        },
        {
          key: "delete-cat",
          action: StandardAction.DELETE,
          label: "",
          icon: <Trash2 className="size-3" />,
          title: "删除分类",
          className: "h-7 w-7 p-0 text-muted-foreground hover:text-destructive",
          onClick: (node) => setDeletingCat(node),
        },
      ]}
    />
  );

  const tagSection = (
    <Card className="flex flex-col border border-border/80 bg-card shadow-xs p-3">
      <DataTable
        data={filteredTags}
        columns={tagColumns}
        rowKey={(t: CustomerTagItem) => t.tagCode}
        subject={customerTagPageContract.subject}
        title="业务标签字典"
        description={`配送策略、结算方式、信用分级等（共 ${tags.length} 个标签）`}
        onCreate={
          canCreateTag
            ? () =>
                setTagModal({
                  open: true,
                  mode: "create",
                  record: null,
                })
            : undefined
        }
        createText="新增标签"
        searchContract={customerTagSearchContract}
        keywordValue={tagKeyword}
        onKeywordChange={setTagKeyword}
        showKeywordFilter={true}
        showPagination={false}
        showColumnSettings={false}
        statusOptions={[
          { value: "DELIVERY", label: "配送策略" },
          { value: "SETTLEMENT", label: "结算方式" },
          { value: "CREDIT", label: "信用分级" },
          { value: "OTHER", label: "其他通用" },
        ]}
        statusValue={tagTypeFilter}
        statusAllValue="ALL"
        statusAllLabel="全部业务类型"
        onStatusChange={(val) => setTagTypeFilter(val)}
      />
    </Card>
  );

  return (
    <div className="flex flex-col gap-6">
      {/* 顶部标题区 */}
      <div className="flex items-center justify-between border-b border-border/80 pb-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-foreground">
            分类与标签字典管理
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            维护客户多级分类树与业务策略标签，首行常驻快速新建，行内支持快捷延伸下级。
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="mb-4 flex items-center justify-between">
          <TabsList className="bg-muted">
            {hasBoth && (
              <TabsTrigger value="all" className="gap-1.5 text-xs">
                全景并排视图
              </TabsTrigger>
            )}
            {canReadCategory && (
              <TabsTrigger value="categories" className="gap-1.5 text-xs">
                <FolderTree className="size-3.5" />
                <span>客户多级分类 ({totalCatCount})</span>
              </TabsTrigger>
            )}
            {canReadTag && (
              <TabsTrigger value="tags" className="gap-1.5 text-xs">
                <TagIcon className="size-3.5" />
                <span>业务标签字典 ({tags.length})</span>
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        {hasBoth && (
          <TabsContent value="all" className="mt-0">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {categorySection}
              {tagSection}
            </div>
          </TabsContent>
        )}

        {canReadCategory && (
          <TabsContent value="categories" className="mt-0">
            {categorySection}
          </TabsContent>
        )}

        {canReadTag && (
          <TabsContent value="tags" className="mt-0">
            {tagSection}
          </TabsContent>
        )}
      </Tabs>

      {/* 分类模态框 */}
      {catModal.open && (
        <CategoryFormModal
          mode={catModal.mode}
          record={catModal.record}
          defaultParentCode={catModal.defaultParentCode}
          categories={categories}
          onClose={() =>
            setCatModal({
              open: false,
              mode: "create",
              record: null,
              defaultParentCode: null,
            })
          }
          onSuccess={() => {
            setCatModal({
              open: false,
              mode: "create",
              record: null,
              defaultParentCode: null,
            });
            router?.refresh();
          }}
        />
      )}

      {/* 标签模态框 */}
      {tagModal.open && (
        <TagFormModal
          mode={tagModal.mode}
          record={tagModal.record}
          onClose={() =>
            setTagModal({ open: false, mode: "create", record: null })
          }
          onSuccess={() => {
            setTagModal({ open: false, mode: "create", record: null });
            router?.refresh();
          }}
        />
      )}

      {/* 分类删除二次确认弹窗 (基于 UI 库 ConfirmDialog) */}
      <ConfirmDialog
        open={Boolean(deletingCat)}
        onOpenChange={(v) => {
          if (!v) setDeletingCat(null);
        }}
        title={`确认删除分类 [${deletingCat?.categoryName || deletingCat?.categoryCode}]？`}
        description="删除后该分类将从分类树中彻底移除。若该分类下存在子级分类或有关联客户档案，系统将自动拦截并禁止删除。"
        confirmText="确认删除"
        cancelText="取消"
        variant="destructive"
        onConfirm={handleConfirmDeleteCat}
      />

      {/* 标签删除二次确认弹窗 (基于 UI 库 ConfirmDialog) */}
      <ConfirmDialog
        open={Boolean(deletingTag)}
        onOpenChange={(v) => {
          if (!v) setDeletingTag(null);
        }}
        title={`确认删除标签 [${deletingTag?.tagName || deletingTag?.tagCode}]？`}
        description="删除后该标签将从标签字典中彻底移除。若当前已被客户档案引用打标，系统将自动拦截并禁止删除。"
        confirmText="确认删除"
        cancelText="取消"
        variant="destructive"
        onConfirm={handleConfirmDeleteTag}
      />
    </div>
  );
}
