"use client";

import React, { useState } from "react";
import { FolderTree, Tag, Plus, ShieldAlert } from "lucide-react";
import {
  createCategoryAction,
  updateCategoryStatusAction,
  createTagAction,
  updateTagStatusAction,
} from "../actions";

interface Props {
  initialCategories: any[];
  initialTags: any[];
}

export function CategoryTagView({ initialCategories, initialTags }: Props) {
  const [categories] = useState(initialCategories);
  const [tags] = useState(initialTags);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 新建分类表单状态
  const [showCatModal, setShowCatModal] = useState(false);
  const [catCode, setCatCode] = useState("");
  const [catName, setCatName] = useState("");
  const [parentCode, setParentCode] = useState("");
  const [catDesc, setCatDesc] = useState("");

  // 新建标签表单状态
  const [showTagModal, setShowTagModal] = useState(false);
  const [tagCode, setTagCode] = useState("");
  const [tagName, setTagName] = useState("");
  const [tagType, setTagType] = useState("DELIVERY");
  const [tagDesc, setTagDesc] = useState("");

  const handleCreateCategory = async (e: React.FormEvent) => {
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
    } catch (err: any) {
      setError(err.message || "请求异常");
    } finally {
      setLoading(false);
    }
  };

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

  const handleCreateTag = async (e: React.FormEvent) => {
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
    } catch (err: any) {
      setError(err.message || "请求异常");
    } finally {
      setLoading(false);
    }
  };

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

  const tagTypeLabels: Record<string, string> = {
    DELIVERY: "配送策略",
    SETTLEMENT: "结算方式",
    CREDIT: "信用分级",
    OTHER: "其他通用",
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            分类与标签管理
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            维护客户多级分类与业务标签字典，用于快速筛选与报价/配送策略匹配
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-400 text-sm">
          <ShieldAlert className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 客户分类树 */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <FolderTree className="size-5 text-zinc-600 dark:text-zinc-400" />
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
                客户分类（多级支持）
              </h2>
            </div>
            <button
              onClick={() => setShowCatModal(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-50 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-xs font-medium rounded-lg transition-colors"
            >
              <Plus className="size-3.5" />
              新建分类
            </button>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {categories.length === 0 ? (
              <p className="text-sm text-zinc-400 text-center py-8">
                暂无客户分类
              </p>
            ) : (
              categories.map((cat) => (
                <div
                  key={cat.categoryCode}
                  className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200/80 dark:border-zinc-700/60 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-zinc-700 dark:text-zinc-300">
                        {cat.categoryCode}
                      </span>
                      <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
                        {cat.categoryName}
                      </span>
                      {cat.parentCode && (
                        <span className="text-xs text-zinc-400">
                          （父级: {cat.parentCode}）
                        </span>
                      )}
                    </div>
                    {cat.description && (
                      <p className="text-xs text-zinc-500 mt-1">
                        {cat.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        cat.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                          : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                      }`}
                    >
                      {cat.status === "ACTIVE" ? "启用" : "停用"}
                    </span>
                    <button
                      onClick={() =>
                        handleToggleCategoryStatus(cat.categoryCode, cat.status)
                      }
                      className="text-xs text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 underline ml-2"
                    >
                      {cat.status === "ACTIVE" ? "停用" : "启用"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 客户标签字典 */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Tag className="size-5 text-zinc-600 dark:text-zinc-400" />
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
                客户标签字典
              </h2>
            </div>
            <button
              onClick={() => setShowTagModal(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-50 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-xs font-medium rounded-lg transition-colors"
            >
              <Plus className="size-3.5" />
              新建标签
            </button>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {tags.length === 0 ? (
              <p className="text-sm text-zinc-400 text-center py-8">
                暂无客户标签
              </p>
            ) : (
              tags.map((t) => (
                <div
                  key={t.tagCode}
                  className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200/80 dark:border-zinc-700/60 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-zinc-700 dark:text-zinc-300">
                        {t.tagCode}
                      </span>
                      <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
                        {t.tagName}
                      </span>
                      <span className="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 rounded">
                        {tagTypeLabels[t.tagType] || t.tagType}
                      </span>
                    </div>
                    {t.description && (
                      <p className="text-xs text-zinc-500 mt-1">
                        {t.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        t.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                          : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                      }`}
                    >
                      {t.status === "ACTIVE" ? "启用" : "停用"}
                    </span>
                    <button
                      onClick={() => handleToggleTagStatus(t.tagCode, t.status)}
                      className="text-xs text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 underline ml-2"
                    >
                      {t.status === "ACTIVE" ? "停用" : "启用"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 新建分类弹窗 */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl max-w-md w-full p-6 border border-zinc-200 dark:border-zinc-800 shadow-xl">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              新建客户分类
            </h3>
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  分类编码 (唯一标识) *
                </label>
                <input
                  required
                  value={catCode}
                  onChange={(e) => setCatCode(e.target.value)}
                  placeholder="如: CUST_CAT_001"
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm bg-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  分类名称 *
                </label>
                <input
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="如: 连锁餐饮 / 企事业单位"
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm bg-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  父级分类编码 (可选)
                </label>
                <select
                  value={parentCode}
                  onChange={(e) => setParentCode(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm bg-transparent"
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
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  描述
                </label>
                <textarea
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm bg-transparent"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCatModal(false)}
                  className="px-4 py-2 border border-zinc-200 dark:border-zinc-700 text-sm font-medium rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-50 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-sm font-medium rounded-lg"
                >
                  {loading ? "保存中..." : "保存分类"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 新建标签弹窗 */}
      {showTagModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl max-w-md w-full p-6 border border-zinc-200 dark:border-zinc-800 shadow-xl">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              新建客户标签
            </h3>
            <form onSubmit={handleCreateTag} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  标签编码 (唯一标识) *
                </label>
                <input
                  required
                  value={tagCode}
                  onChange={(e) => setTagCode(e.target.value)}
                  placeholder="如: TAG_VIP"
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm bg-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  标签名称 *
                </label>
                <input
                  required
                  value={tagName}
                  onChange={(e) => setTagName(e.target.value)}
                  placeholder="如: VIP专属、早间必达"
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm bg-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  标签类型 *
                </label>
                <select
                  value={tagType}
                  onChange={(e) => setTagType(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm bg-transparent"
                >
                  <option value="DELIVERY">配送策略 (DELIVERY)</option>
                  <option value="SETTLEMENT">结算方式 (SETTLEMENT)</option>
                  <option value="CREDIT">信用分级 (CREDIT)</option>
                  <option value="OTHER">其他通用 (OTHER)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  描述
                </label>
                <textarea
                  value={tagDesc}
                  onChange={(e) => setTagDesc(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm bg-transparent"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTagModal(false)}
                  className="px-4 py-2 border border-zinc-200 dark:border-zinc-700 text-sm font-medium rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-50 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-sm font-medium rounded-lg"
                >
                  {loading ? "保存中..." : "保存标签"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
