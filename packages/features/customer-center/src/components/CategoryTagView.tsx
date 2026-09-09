"use client";

import React, { useState } from "react";
import { FolderTree, Tag, Plus, ShieldAlert, LayoutGrid } from "lucide-react";
import {
  DictionarySectionCard,
  Button,
  Input,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@chenrun/ui";
import {
  createCategoryAction,
  updateCategoryStatusAction,
  createTagAction,
  updateTagStatusAction,
} from "../actions";
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
  const [categories] = useState<CustomerCategoryItem[]>(initialCategories);
  const [tags] = useState<CustomerTagItem[]>(initialTags);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 新建分类模态框表单状态
  const [showCatModal, setShowCatModal] = useState(false);
  const [catCode, setCatCode] = useState("");
  const [catName, setCatName] = useState("");
  const [parentCode, setParentCode] = useState("");
  const [catDesc, setCatDesc] = useState("");

  // 新建标签模态框表单状态
  const [showTagModal, setShowTagModal] = useState(false);
  const [tagCode, setTagCode] = useState("");
  const [tagName, setTagName] = useState("");
  const [tagType, setTagType] = useState("DELIVERY");
  const [tagDesc, setTagDesc] = useState("");

  /**
   * 提交新建客户分类数据
   */
  const handleCreateCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await createCategoryAction({
        categoryCode: catCode,
        categoryName: catName,
        parentCode: parentCode || null,
        description: catDesc || null,
      });
      if (res.success) {
        setShowCatModal(false);
        setCatCode("");
        setCatName("");
        setParentCode("");
        setCatDesc("");
        window.location.reload();
      } else {
        setError(res.error || "创建分类失败");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "请求异常");
    } finally {
      setLoading(false);
    }
  };

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
        window.location.reload();
      } else {
        setError(res.error || "变更状态失败");
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * 提交新建客户业务标签
   */
  const handleCreateTag = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await createTagAction({
        tagCode,
        tagName,
        tagType,
        description: tagDesc || null,
      });
      if (res.success) {
        setShowTagModal(false);
        setTagCode("");
        setTagName("");
        setTagDesc("");
        window.location.reload();
      } else {
        setError(res.error || "创建标签失败");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "请求异常");
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
        window.location.reload();
      } else {
        setError(res.error || "变更标签状态失败");
      }
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
    <div className="space-y-6">
      {/* 顶部标题区 */}
      <div className="flex justify-between items-center pb-4 border-b">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            分类与标签字典管理
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            维护客户多级分类树与业务策略标签，用于客户建档、快速筛选与阶梯报价/配送时段智能匹配。
          </p>
        </div>
      </div>

      {/* 错误提示框 */}
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg flex items-center gap-2 text-destructive text-sm">
          <ShieldAlert className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 支持选项卡切换或并排双栏 */}
      <Tabs defaultValue="all" className="w-full">
        <div className="flex items-center justify-between mb-4">
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DictionarySectionCard
              title="客户分类（多级支持）"
              description="按行业或业态构建树状分类（如：机关食堂、品牌连锁、生鲜商超）"
              icon={<FolderTree className="size-4 text-primary" />}
              searchPlaceholder="搜索分类名称或编码..."
              actionButton={
                <Button
                  size="sm"
                  onClick={() => setShowCatModal(true)}
                  className="font-semibold shadow-xs"
                >
                  <Plus className="size-3.5 mr-1" />
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
                <Button
                  size="sm"
                  onClick={() => setShowTagModal(true)}
                  className="font-semibold shadow-xs"
                >
                  <Plus className="size-3.5 mr-1" />
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
              <Button
                size="sm"
                onClick={() => setShowCatModal(true)}
                className="font-semibold shadow-xs"
              >
                <Plus className="size-3.5 mr-1" />
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
              <Button
                size="sm"
                onClick={() => setShowTagModal(true)}
                className="font-semibold shadow-xs"
              >
                <Plus className="size-3.5 mr-1" />
                <span>新建标签</span>
              </Button>
            }
            items={tagItems}
            emptyText="暂无业务标签记录"
          />
        </TabsContent>
      </Tabs>

      {/* 新建分类模态弹窗 */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card text-card-foreground rounded-xl max-w-md w-full p-6 border shadow-2xl">
            <h3 className="text-base font-bold text-foreground mb-4">
              新建客户分类
            </h3>
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  分类编码 (唯一标识) *
                </label>
                <Input
                  required
                  value={catCode}
                  onChange={(e) => setCatCode(e.target.value)}
                  placeholder="如: CUST_CAT_001"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  分类名称 *
                </label>
                <Input
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="如: 连锁餐饮 / 企事业单位"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  父级分类编码 (可选)
                </label>
                <select
                  value={parentCode}
                  onChange={(e) => setParentCode(e.target.value)}
                  className="w-full h-9 px-3 border border-input rounded-md bg-background text-foreground text-sm"
                >
                  <option value="">(作为根分类)</option>
                  {categories.map((c) => (
                    <option key={c.categoryCode} value={c.categoryCode}>
                      {c.categoryName} ({c.categoryCode})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  业务描述说明
                </label>
                <Input
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  placeholder="分类适用范围与说明"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCatModal(false)}
                >
                  取消
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={loading}
                  className="font-semibold"
                >
                  {loading ? "保存中..." : "保存分类"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 新建业务标签模态弹窗 */}
      {showTagModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card text-card-foreground rounded-xl max-w-md w-full p-6 border shadow-2xl">
            <h3 className="text-base font-bold text-foreground mb-4">
              新建客户业务标签
            </h3>
            <form onSubmit={handleCreateTag} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  标签编码 (唯一标识) *
                </label>
                <Input
                  required
                  value={tagCode}
                  onChange={(e) => setTagCode(e.target.value)}
                  placeholder="如: TAG_VIP"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  标签名称 *
                </label>
                <Input
                  required
                  value={tagName}
                  onChange={(e) => setTagName(e.target.value)}
                  placeholder="如: VIP专属、早间必达"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  标签业务类型 *
                </label>
                <select
                  value={tagType}
                  onChange={(e) => setTagType(e.target.value)}
                  className="w-full h-9 px-3 border border-input rounded-md bg-background text-foreground text-sm"
                >
                  <option value="DELIVERY">配送策略 (DELIVERY)</option>
                  <option value="SETTLEMENT">结算方式 (SETTLEMENT)</option>
                  <option value="CREDIT">信用分级 (CREDIT)</option>
                  <option value="OTHER">其他通用 (OTHER)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  业务描述说明
                </label>
                <Input
                  value={tagDesc}
                  onChange={(e) => setTagDesc(e.target.value)}
                  placeholder="标签打标规则与适用场景"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTagModal(false)}
                >
                  取消
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={loading}
                  className="font-semibold"
                >
                  {loading ? "保存中..." : "保存标签"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
