"use client";

import React, { useState, useEffect } from "react";
import { FolderTree, Tag, Plus, LayoutGrid } from "lucide-react";
import {
  DictionarySectionCard,
  Button,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  toast,
  useSafeRouter,
} from "@chenrun/ui";
import { updateCategoryStatusAction, updateTagStatusAction } from "../actions";
import { CreateCategoryModal } from "./CreateCategoryModal";
import { CreateTagModal } from "./CreateTagModal";
import type { CustomerCategoryItem, CustomerTagItem } from "../types";

/**
 * 分类与标签管理页面入参属性契约
 */
interface Props {
  /** 初始分类列表数据集 */
  initialCategories: CustomerCategoryItem[];
  /** 初始业务标签字典数据集 */
  initialTags: CustomerTagItem[];
}

/**
 * 客户中心 - 分类与标签字典管理工作台
 * 遵循现代数智工业风规范，全面基于 shadcn/ui 的 DictionarySectionCard、Tabs、Button、Input 等组件构建
 */
export function CategoryTagView({ initialCategories, initialTags }: Props) {
  const router = useSafeRouter();
  const [categories, setCategories] =
    useState<CustomerCategoryItem[]>(initialCategories);
  const [tags, setTags] = useState<CustomerTagItem[]>(initialTags);

  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  useEffect(() => {
    setTags(initialTags);
  }, [initialTags]);
  const [loading, setLoading] = useState(false);

  const [showCatModal, setShowCatModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);

  /**
   * 切换客户分类启用/停用状态
   */
  const handleToggleCategoryStatus = async (
    categoryCode: string,
    currentStatus: string,
  ) => {
    setLoading(true);
    const nextStatus = currentStatus === "ACTIVE" ? "DISABLED" : "ACTIVE";
    try {
      const res = await updateCategoryStatusAction(categoryCode, nextStatus);
      if (res.success) {
        setCategories((prev) =>
          prev.map((item) =>
            item.categoryCode === categoryCode
              ? { ...item, status: nextStatus }
              : item,
          ),
        );
        toast.success(nextStatus === "ACTIVE" ? "分类已启用" : "分类已停用");
        router?.refresh();
      } else {
        toast.error(res.error || "变更状态失败");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "变更状态异常");
    } finally {
      setLoading(false);
    }
  };

  /**
   * 切换客户业务标签启用/停用状态
   */
  const handleToggleTagStatus = async (
    tagCodeStr: string,
    currentStatus: string,
  ) => {
    setLoading(true);
    const nextStatus = currentStatus === "ACTIVE" ? "DISABLED" : "ACTIVE";
    try {
      const res = await updateTagStatusAction(tagCodeStr, nextStatus);
      if (res.success) {
        setTags((prev) =>
          prev.map((item) =>
            item.tagCode === tagCodeStr
              ? { ...item, status: nextStatus }
              : item,
          ),
        );
        toast.success(nextStatus === "ACTIVE" ? "标签已启用" : "标签已停用");
        router?.refresh();
      } else {
        toast.error(res.error || "变更标签状态失败");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "变更标签状态异常");
    } finally {
      setLoading(false);
    }
  };

  // 标签类型语义字典映射
  const tagTypeLabels: Record<string, string> = {
    DELIVERY: "配送策略",
    SETTLEMENT: "结算方式",
    CREDIT: "信用分级",
    OTHER: "其他通用",
  };

  /**
   * 转换为分类字典标准条目
   */
  const categoryItems = categories.map((cat) => ({
    key: cat.categoryCode,
    code: cat.categoryCode,
    name: cat.categoryName,
    parentInfo: cat.parentCode ? `（父级: ${cat.parentCode}）` : null,
    description: cat.description,
    status: cat.status || "ACTIVE",
    actions: (
      <Button
        variant="ghost"
        size="sm"
        disabled={loading}
        onClick={() =>
          handleToggleCategoryStatus(cat.categoryCode, cat.status || "ACTIVE")
        }
        className="h-7 px-2 text-xs"
      >
        {cat.status === "ACTIVE" ? "停用" : "启用"}
      </Button>
    ),
  }));

  /**
   * 转换为业务标签标准条目
   */
  const tagItems = tags.map((t) => ({
    key: t.tagCode,
    code: t.tagCode,
    name: t.tagName,
    typeTag: tagTypeLabels[t.tagType || ""] || t.tagType,
    description: t.description,
    status: t.status || "ACTIVE",
    actions: (
      <Button
        variant="ghost"
        size="sm"
        disabled={loading}
        onClick={() => handleToggleTagStatus(t.tagCode, t.status || "ACTIVE")}
        className="h-7 px-2 text-xs"
      >
        {t.status === "ACTIVE" ? "停用" : "启用"}
      </Button>
    ),
  }));

  return (
    <div className="flex flex-col gap-6">
      {/* 顶部标题区 */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-foreground">
            分类与标签字典管理
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            维护客户多级分类树与业务策略标签，用于客户建档、快速筛选与阶梯报价/配送时段智能匹配。
          </p>
        </div>
      </div>

      {/* 支持选项卡切换或并排双栏 */}
      <Tabs defaultValue="all" className="w-full">
        <div className="mb-4 flex items-center justify-between">
          <TabsList className="bg-muted">
            <TabsTrigger value="all" className="gap-1.5 text-xs">
              <LayoutGrid className="size-3.5" />
              <span>并排总览</span>
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-1.5 text-xs">
              <FolderTree className="size-3.5" />
              <span>客户多级分类 ({categories.length})</span>
            </TabsTrigger>
            <TabsTrigger value="tags" className="gap-1.5 text-xs">
              <Tag className="size-3.5" />
              <span>业务标签字典 ({tags.length})</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* 1. 并排双栏总览 */}
        <TabsContent value="all" className="mt-0">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <DictionarySectionCard
              title="客户分类（多级支持）"
              description="按行业或业态构建树状分类（如：机关食堂、品牌连锁、生鲜商超）"
              icon={<FolderTree className="size-4 text-primary" />}
              searchPlaceholder="搜索分类名称或编码..."
              actionButton={
                <Button size="sm" onClick={() => setShowCatModal(true)}>
                  <Plus data-icon="inline-start" />
                  <span>新建分类</span>
                </Button>
              }
              items={categoryItems}
              emptyText="暂无客户分类记录"
            />

            <DictionarySectionCard
              title="业务标签字典"
              description="包含配送策略、结算方式、信用等级等多维业务决策标记"
              icon={<Tag className="size-4 text-primary" />}
              searchPlaceholder="搜索标签名称或编码..."
              actionButton={
                <Button size="sm" onClick={() => setShowTagModal(true)}>
                  <Plus data-icon="inline-start" />
                  <span>新建标签</span>
                </Button>
              }
              items={tagItems}
              emptyText="暂无业务标签记录"
            />
          </div>
        </TabsContent>

        {/* 2. 单独查看分类树 */}
        <TabsContent value="categories" className="mt-0">
          <DictionarySectionCard
            title="客户分类（多级支持）"
            description="按行业或业态构建树状分类（如：机关食堂、品牌连锁、生鲜商超）"
            icon={<FolderTree className="size-4 text-primary" />}
            searchPlaceholder="搜索分类名称或编码..."
            actionButton={
              <Button size="sm" onClick={() => setShowCatModal(true)}>
                <Plus data-icon="inline-start" />
                <span>新建分类</span>
              </Button>
            }
            items={categoryItems}
            emptyText="暂无客户分类记录"
          />
        </TabsContent>

        {/* 3. 单独查看标签字典 */}
        <TabsContent value="tags" className="mt-0">
          <DictionarySectionCard
            title="业务标签字典"
            description="包含配送策略、结算方式、信用等级等多维业务决策标记"
            icon={<Tag className="size-4 text-primary" />}
            searchPlaceholder="搜索标签名称或编码..."
            actionButton={
              <Button size="sm" onClick={() => setShowTagModal(true)}>
                <Plus data-icon="inline-start" />
                <span>新建标签</span>
              </Button>
            }
            items={tagItems}
            emptyText="暂无业务标签记录"
          />
        </TabsContent>
      </Tabs>

      {showCatModal && (
        <CreateCategoryModal
          categories={categories}
          onClose={() => setShowCatModal(false)}
          onCreated={() => router?.refresh()}
        />
      )}
      {showTagModal && (
        <CreateTagModal
          onClose={() => setShowTagModal(false)}
          onCreated={() => router?.refresh()}
        />
      )}
    </div>
  );
}
