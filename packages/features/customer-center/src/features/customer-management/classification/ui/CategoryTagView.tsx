"use client";

import React, { useState, useEffect } from "react";
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Edit2,
  Trash2,
  CornerDownRight,
  FolderTree,
  Tag as TagIcon,
  Search,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Button,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
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
  readonly initialCategories: CustomerCategoryItem[];
  readonly initialTags: CustomerTagItem[];
}

export function CategoryTagView({
  initialCategories,
  initialTags,
}: CategoryTagViewProps) {
  const router = useSafeRouter();
  const [categories, setCategories] =
    useState<CustomerCategoryItem[]>(initialCategories);
  const [tags, setTags] = useState<CustomerTagItem[]>(initialTags);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  useEffect(() => {
    setTags(initialTags);
  }, [initialTags]);

  // 折叠/展开节点集合
  const [collapsedKeys, setCollapsedKeys] = useState<Set<string>>(new Set());

  // 搜索关键字
  const [catKeyword, setCatKeyword] = useState("");
  const [tagKeyword, setTagKeyword] = useState("");

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

  const toggleCollapse = (code: string) => {
    setCollapsedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  // --- 分类操作 ---
  const handleToggleCatStatus = async (
    code: string,
    currentStatus: string,
  ) => {
    setLoading(true);
    const nextStatus = currentStatus === "ACTIVE" ? "DISABLED" : "ACTIVE";
    try {
      const res = await updateCategoryStatusAction(code, nextStatus);
      if (res.success) {
        toast.success(nextStatus === "ACTIVE" ? "分类已启用" : "分类已停用");
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

  const handleDeleteCat = async (code: string) => {
    if (!window.confirm(`确认删除分类 [${code}] 吗？`)) return;
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
    }
  };

  // --- 标签操作 ---
  const handleToggleTagStatus = async (
    code: string,
    currentStatus: string,
  ) => {
    setLoading(true);
    const nextStatus = currentStatus === "ACTIVE" ? "DISABLED" : "ACTIVE";
    try {
      const res = await updateTagStatusAction(code, nextStatus);
      if (res.success) {
        setTags((prev) =>
          prev.map((t) =>
            t.tagCode === code ? { ...t, status: nextStatus } : t,
          ),
        );
        toast.success(nextStatus === "ACTIVE" ? "标签已启用" : "标签已停用");
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

  const handleDeleteTag = async (code: string) => {
    if (!window.confirm(`确认删除标签 [${code}] 吗？`)) return;
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
    }
  };

  const totalCatCount = countTreeNodes(categories);

  // 递归渲染分类树节点
  const renderCategoryNode = (
    node: CustomerCategoryItem,
    depth = 0,
  ): React.ReactNode => {
    const hasChildren = Boolean(node.children && node.children.length > 0);
    const isCollapsed = collapsedKeys.has(node.categoryCode);
    const isActive = node.status === "ACTIVE";

    // 关键词筛选命中逻辑
    const matchesKeyword =
      !catKeyword ||
      node.categoryCode.toLowerCase().includes(catKeyword.toLowerCase()) ||
      node.categoryName.toLowerCase().includes(catKeyword.toLowerCase());

    return (
      <div key={node.categoryCode} className="flex flex-col gap-1.5">
        {matchesKeyword && (
          <div
            style={{ paddingLeft: `${depth * 24 + 12}px` }}
            className="group flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-card p-2.5 transition-colors hover:bg-muted/40 shadow-xs"
          >
            <div className="flex min-w-0 flex-1 items-center gap-2">
              {/* 折叠箭头或层级连线 */}
              {hasChildren ? (
                <button
                  type="button"
                  onClick={() => toggleCollapse(node.categoryCode)}
                  className="size-5 rounded flex items-center justify-center text-muted-foreground hover:bg-muted"
                >
                  {isCollapsed ? (
                    <ChevronRight className="size-3.5" />
                  ) : (
                    <ChevronDown className="size-3.5" />
                  )}
                </button>
              ) : depth > 0 ? (
                <div className="size-5 flex items-center justify-center text-muted-foreground/50">
                  <CornerDownRight className="size-3.5" />
                </div>
              ) : (
                <div className="size-5" />
              )}

              <span className="rounded border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-xs font-semibold text-foreground">
                {node.categoryCode}
              </span>
              <span className="truncate text-sm font-medium text-foreground">
                {node.categoryName}
              </span>
              {node.description && (
                <span className="hidden sm:inline truncate text-xs text-muted-foreground max-w-[200px]">
                  {node.description}
                </span>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <Badge
                variant={isActive ? "success" : "secondary"}
                size="sm"
                className="text-[11px]"
              >
                {isActive ? "启用" : "停用"}
              </Badge>

              {/* 核心创新：行内就近“+ 子级”按钮 */}
              <Button
                variant="outline"
                size="sm"
                disabled={loading}
                onClick={() =>
                  setCatModal({
                    open: true,
                    mode: "create",
                    record: null,
                    defaultParentCode: node.categoryCode,
                  })
                }
                className="h-7 px-2 text-xs border-dashed text-primary hover:bg-primary/5 hover:text-primary"
                title={`在【${node.categoryName}】下新增子分类`}
              >
                <Plus className="size-3 mr-1" />
                下级
              </Button>

              <Button
                variant="ghost"
                size="sm"
                disabled={loading}
                onClick={() =>
                  setCatModal({
                    open: true,
                    mode: "edit",
                    record: node,
                    defaultParentCode: null,
                  })
                }
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <Edit2 className="size-3 mr-1" />
                编辑
              </Button>

              <Button
                variant="ghost"
                size="sm"
                disabled={loading}
                onClick={() =>
                  handleToggleCatStatus(node.categoryCode, node.status || "ACTIVE")
                }
                className="h-7 px-2 text-xs"
              >
                {isActive ? "停用" : "启用"}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                disabled={loading}
                onClick={() => handleDeleteCat(node.categoryCode)}
                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-3" />
              </Button>
            </div>
          </div>
        )}

        {/* 递归渲染展开的子分类 */}
        {hasChildren &&
          !isCollapsed &&
          node.children!.map((child) => renderCategoryNode(child, depth + 1))}
      </div>
    );
  };

  const filteredTags = tags.filter((t) => {
    if (!tagKeyword) return true;
    const kw = tagKeyword.toLowerCase();
    return (
      t.tagCode.toLowerCase().includes(kw) ||
      t.tagName.toLowerCase().includes(kw) ||
      (t.description && t.description.toLowerCase().includes(kw))
    );
  });

  const categorySection = (
    <Card className="flex flex-col border border-border/80 bg-card shadow-xs">
      <CardHeader className="gap-3 border-b border-border/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <FolderTree className="size-4 text-primary" />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-base font-bold text-foreground">
              客户多级分类树
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              按行业/业态构建树状体系（总计 {totalCatCount} 个分类节点）
            </CardDescription>
          </div>
        </div>

        <InputGroup>
          <InputGroupAddon align="inline-start">
            <Search className="size-3.5 text-muted-foreground" />
          </InputGroupAddon>
          <InputGroupInput
            value={catKeyword}
            onChange={(e) => setCatKeyword(e.target.value)}
            placeholder="搜索分类名称或编码..."
            className="h-8 text-xs"
          />
        </InputGroup>
      </CardHeader>

      <CardContent className="flex-1 p-4">
        <div className="flex max-h-[580px] flex-col gap-2 overflow-y-auto pr-1">
          {/* 核心创新：第一行常驻通栏“+ 新增一级根分类”虚线按钮 */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setCatModal({
                open: true,
                mode: "create",
                record: null,
                defaultParentCode: null,
              })
            }
            className="w-full h-10 border-dashed border-border/90 bg-muted/20 hover:bg-primary/5 hover:border-primary/50 text-muted-foreground hover:text-primary transition-all flex items-center justify-center gap-2 rounded-lg font-medium text-xs"
          >
            <Plus className="size-4" />
            <span>新增一级根分类</span>
          </Button>

          {categories.length === 0 ? (
            <div className="p-8 border border-dashed rounded-lg text-center text-xs text-muted-foreground">
              暂无分类数据，点击上方按钮创建第一条根分类
            </div>
          ) : (
            categories.map((rootNode) => renderCategoryNode(rootNode, 0))
          )}
        </div>
      </CardContent>
    </Card>
  );

  const tagSection = (
    <Card className="flex flex-col border border-border/80 bg-card shadow-xs">
      <CardHeader className="gap-3 border-b border-border/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <TagIcon className="size-4 text-primary" />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-base font-bold text-foreground">
              业务标签字典
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              配送策略、结算方式、信用分级等（共 {tags.length} 个标签）
            </CardDescription>
          </div>
        </div>

        <InputGroup>
          <InputGroupAddon align="inline-start">
            <Search className="size-3.5 text-muted-foreground" />
          </InputGroupAddon>
          <InputGroupInput
            value={tagKeyword}
            onChange={(e) => setTagKeyword(e.target.value)}
            placeholder="搜索标签名称或编码..."
            className="h-8 text-xs"
          />
        </InputGroup>
      </CardHeader>

      <CardContent className="flex-1 p-4">
        <div className="flex max-h-[580px] flex-col gap-2 overflow-y-auto pr-1">
          {/* 核心创新：第一行常驻通栏“+ 新增业务标签”虚线按钮 */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setTagModal({
                open: true,
                mode: "create",
                record: null,
              })
            }
            className="w-full h-10 border-dashed border-border/90 bg-muted/20 hover:bg-primary/5 hover:border-primary/50 text-muted-foreground hover:text-primary transition-all flex items-center justify-center gap-2 rounded-lg font-medium text-xs"
          >
            <Plus className="size-4" />
            <span>新增业务标签</span>
          </Button>

          {filteredTags.length === 0 ? (
            <div className="p-8 border border-dashed rounded-lg text-center text-xs text-muted-foreground">
              暂无标签记录，点击上方按钮创建第一条标签
            </div>
          ) : (
            filteredTags.map((t) => {
              const isActive = t.status === "ACTIVE";
              return (
                <div
                  key={t.tagCode}
                  className="group flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-card p-2.5 transition-colors hover:bg-muted/40 shadow-xs"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="rounded border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-xs font-semibold text-foreground">
                      {t.tagCode}
                    </span>
                    <span className="truncate text-sm font-medium text-foreground">
                      {t.tagName}
                    </span>
                    <Badge variant="outline" size="sm" className="text-[11px]">
                      {tagTypeLabels[t.tagType || ""] || t.tagType}
                    </Badge>
                    {t.description && (
                      <span className="hidden sm:inline truncate text-xs text-muted-foreground max-w-[200px]">
                        {t.description}
                      </span>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5">
                    <Badge
                      variant={isActive ? "success" : "secondary"}
                      size="sm"
                      className="text-[11px]"
                    >
                      {isActive ? "启用" : "停用"}
                    </Badge>

                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={loading}
                      onClick={() =>
                        setTagModal({
                          open: true,
                          mode: "edit",
                          record: t,
                        })
                      }
                      className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <Edit2 className="size-3 mr-1" />
                      编辑
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={loading}
                      onClick={() =>
                        handleToggleTagStatus(t.tagCode, t.status || "ACTIVE")
                      }
                      className="h-7 px-2 text-xs"
                    >
                      {isActive ? "停用" : "启用"}
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={loading}
                      onClick={() => handleDeleteTag(t.tagCode)}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
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

      <Tabs defaultValue="all" className="w-full">
        <div className="mb-4 flex items-center justify-between">
          <TabsList className="bg-muted">
            <TabsTrigger value="all" className="gap-1.5 text-xs">
              全景并排视图
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-1.5 text-xs">
              <FolderTree className="size-3.5" />
              <span>客户多级分类 ({totalCatCount})</span>
            </TabsTrigger>
            <TabsTrigger value="tags" className="gap-1.5 text-xs">
              <TagIcon className="size-3.5" />
              <span>业务标签字典 ({tags.length})</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all" className="mt-0">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {categorySection}
            {tagSection}
          </div>
        </TabsContent>

        <TabsContent value="categories" className="mt-0">
          {categorySection}
        </TabsContent>

        <TabsContent value="tags" className="mt-0">
          {tagSection}
        </TabsContent>
      </Tabs>

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
    </div>
  );
}
