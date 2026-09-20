"use client";

import {
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  IconPicker,
} from "@base/ui";
import { ShieldCheck } from "lucide-react";
import type {
  StandardPageDescriptor,
  TenantMenuNode,
} from "@base/authorization";

export interface NodePropertyFormProps {
  readonly selectedNode: TenantMenuNode;
  readonly availableParentGroups: readonly {
    id: string;
    label: string;
    depth: number;
  }[];
  readonly categorizedPages: readonly {
    featureId: string;
    featureName: string;
    pages: StandardPageDescriptor[];
  }[];
  readonly pageMap: ReadonlyMap<string, StandardPageDescriptor>;
  readonly onUpdateNode: (patch: Partial<TenantMenuNode>) => void;
  readonly onSelectPageKey: (key: string) => void;
  readonly onMoveToParent: (targetParentId: string | null) => void;
}

export function NodePropertyForm({
  selectedNode,
  availableParentGroups,
  categorizedPages,
  pageMap,
  onUpdateNode,
  onSelectPageKey,
  onMoveToParent,
}: NodePropertyFormProps) {
  const pageMeta = selectedNode.pageKey
    ? pageMap.get(selectedNode.pageKey)
    : null;
  const isProtected = Boolean(selectedNode.isProtected || pageMeta?.isProtected);

  const currentParentLabel = selectedNode.parentId
    ? availableParentGroups.find((g) => g.id === selectedNode.parentId)
        ?.label || "父级目录"
    : "[顶级根节点]";

  return (
    <div className="space-y-3">
      {/* 第一行核心字段：等宽对称排布，彻底消除错位与留白浪费 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-start">
        {selectedNode.itemType === "PAGE" && (
          <>
            {/* 1. 关联功能页面 */}
            <div className="sm:col-span-2 lg:col-span-4 space-y-1">
              <Label className="text-xs font-medium text-muted-foreground">
                关联系统功能
              </Label>
              <Select
                value={selectedNode.pageKey || ""}
                onValueChange={(val) => {
                  if (val) onSelectPageKey(val);
                }}
              >
                <SelectTrigger className="h-8 text-xs font-medium w-full">
                  <SelectValue placeholder="选择功能页面...">
                    {pageMeta
                      ? `${pageMeta.defaultLabel} (${pageMeta.pageKey})`
                      : selectedNode.pageKey || "选择功能页面..."}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-[280px]">
                  {categorizedPages.map((cat) => (
                    <div key={cat.featureId} className="py-1">
                      <div className="px-2 py-0.5 text-[10px] font-semibold text-muted-foreground bg-muted/40">
                        {cat.featureName}
                      </div>
                      {cat.pages.map((p) => (
                        <SelectItem
                          key={p.pageKey}
                          value={p.pageKey}
                          className="text-xs pl-4"
                        >
                          <span className="font-medium">{p.defaultLabel}</span>
                          <span className="ml-2 font-mono text-[10px] text-muted-foreground">
                            ({p.href})
                          </span>
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-[10px] text-primary font-mono truncate px-0.5">
                路由: {pageMeta?.href || selectedNode.pageKey || "--"}
              </div>
            </div>

            {/* 2. 菜单显示别名 */}
            <div className="sm:col-span-1 lg:col-span-4 space-y-1">
              <Label className="text-xs font-medium text-muted-foreground">
                显示别名
              </Label>
              <Input
                value={
                  selectedNode.customLabel ??
                  (selectedNode.pageKey
                    ? pageMap.get(selectedNode.pageKey)?.defaultLabel
                    : "") ??
                  ""
                }
                placeholder={
                  selectedNode.pageKey
                    ? pageMap.get(selectedNode.pageKey)?.defaultLabel
                    : "输入别名"
                }
                className="h-8 text-xs font-medium"
                onChange={(e) =>
                  onUpdateNode({
                    customLabel: e.target.value.trim() ? e.target.value : null,
                  })
                }
              />
              <div className="text-[10px] text-muted-foreground truncate px-0.5">
                默认: {pageMeta?.defaultLabel || "--"}
              </div>
            </div>

            {/* 3. 所属父级目录 */}
            <div className="sm:col-span-1 lg:col-span-4 space-y-1">
              <Label className="text-xs font-medium text-muted-foreground">
                所属父级目录
              </Label>
              <Select
                value={selectedNode.parentId || "ROOT"}
                onValueChange={(val) =>
                  onMoveToParent(val === "ROOT" ? null : val)
                }
              >
                <SelectTrigger className="h-8 text-xs w-full">
                  <SelectValue placeholder="[顶级根节点]">
                    {currentParentLabel}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-[220px]">
                  <SelectItem value="ROOT" className="text-xs font-semibold">
                    [顶级根节点]
                  </SelectItem>
                  {availableParentGroups
                    .filter((g) => g.id !== selectedNode.id)
                    .map((g) => (
                      <SelectItem key={g.id} value={g.id} className="text-xs">
                        {"— ".repeat(g.depth)} 📁 {g.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <div className="text-[10px] text-muted-foreground truncate px-0.5">
                层级: {selectedNode.parentId ? "子菜单项" : "顶级菜单项"}
              </div>
            </div>
          </>
        )}

        {selectedNode.itemType === "GROUP" && (
          <>
            <div className="sm:col-span-1 lg:col-span-6 space-y-1">
              <Label className="text-xs font-medium text-muted-foreground">
                目录分组名称
              </Label>
              <Input
                value={selectedNode.customLabel || ""}
                placeholder="输入目录名称，如：客户中心、企业系统设置"
                className="h-8 text-xs font-medium"
                onChange={(e) =>
                  onUpdateNode({
                    customLabel: e.target.value.trim() ? e.target.value : null,
                  })
                }
              />
              <div className="text-[10px] text-muted-foreground truncate px-0.5">
                用于侧边栏折叠大分类标题
              </div>
            </div>

            <div className="sm:col-span-1 lg:col-span-6 space-y-1">
              <Label className="text-xs font-medium text-muted-foreground">
                所属父级目录
              </Label>
              <Select
                value={selectedNode.parentId || "ROOT"}
                onValueChange={(val) =>
                  onMoveToParent(val === "ROOT" ? null : val)
                }
              >
                <SelectTrigger className="h-8 text-xs w-full">
                  <SelectValue placeholder="[顶级根节点]">
                    {currentParentLabel}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-[220px]">
                  <SelectItem value="ROOT" className="text-xs font-semibold">
                    [顶级根节点]
                  </SelectItem>
                  {availableParentGroups
                    .filter((g) => g.id !== selectedNode.id)
                    .map((g) => (
                      <SelectItem key={g.id} value={g.id} className="text-xs">
                        {"— ".repeat(g.depth)} 📁 {g.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <div className="text-[10px] text-muted-foreground truncate px-0.5">
                层级: {selectedNode.parentId ? "嵌套子目录" : "顶级主大纲"}
              </div>
            </div>
          </>
        )}

        {selectedNode.itemType === "LINK" && (
          <>
            <div className="sm:col-span-2 lg:col-span-5 space-y-1">
              <Label className="text-xs font-medium text-muted-foreground">
                外部链接地址
              </Label>
              <Input
                value={selectedNode.externalUrl || ""}
                placeholder="https://bi.company.com"
                className="h-8 text-xs font-mono"
                onChange={(e) => onUpdateNode({ externalUrl: e.target.value })}
              />
              <div className="text-[10px] text-primary font-mono truncate px-0.5">
                支持 https:// 或 http:// 完整地址
              </div>
            </div>

            <div className="sm:col-span-1 lg:col-span-4 space-y-1">
              <Label className="text-xs font-medium text-muted-foreground">
                链接显示名称
              </Label>
              <Input
                value={selectedNode.customLabel || ""}
                placeholder="输入外部系统或报表名称"
                className="h-8 text-xs font-medium"
                onChange={(e) =>
                  onUpdateNode({
                    customLabel: e.target.value.trim() ? e.target.value : null,
                  })
                }
              />
              <div className="text-[10px] text-muted-foreground truncate px-0.5">
                外部报表/系统别名
              </div>
            </div>

            <div className="sm:col-span-1 lg:col-span-3 space-y-1">
              <Label className="text-xs font-medium text-muted-foreground">
                所属父级目录
              </Label>
              <Select
                value={selectedNode.parentId || "ROOT"}
                onValueChange={(val) =>
                  onMoveToParent(val === "ROOT" ? null : val)
                }
              >
                <SelectTrigger className="h-8 text-xs w-full">
                  <SelectValue placeholder="[顶级根节点]">
                    {currentParentLabel}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-[220px]">
                  <SelectItem value="ROOT" className="text-xs font-semibold">
                    [顶级根节点]
                  </SelectItem>
                  {availableParentGroups
                    .filter((g) => g.id !== selectedNode.id)
                    .map((g) => (
                      <SelectItem key={g.id} value={g.id} className="text-xs">
                        {"— ".repeat(g.depth)} 📁 {g.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <div className="text-[10px] text-muted-foreground truncate px-0.5">
                层级: {selectedNode.parentId ? "子链接项" : "顶级根外链"}
              </div>
            </div>
          </>
        )}

        {selectedNode.itemType === "SECTION" && (
          <>
            <div className="sm:col-span-1 lg:col-span-6 space-y-1">
              <Label className="text-xs font-medium text-muted-foreground">
                分区标头名称
              </Label>
              <Input
                value={selectedNode.customLabel || ""}
                placeholder="输入视觉大区标头，如：客户中心、系统管理"
                className="h-8 text-xs font-medium"
                onChange={(e) =>
                  onUpdateNode({
                    customLabel: e.target.value.trim() ? e.target.value : null,
                  })
                }
              />
              <div className="text-[10px] text-muted-foreground truncate px-0.5">
                在侧边栏渲染为静态小灰字标头 (SidebarGroupLabel)
              </div>
            </div>

            <div className="sm:col-span-1 lg:col-span-6 space-y-1">
              <Label className="text-xs font-medium text-muted-foreground">
                所属父级目录
              </Label>
              <Select
                value={selectedNode.parentId || "ROOT"}
                onValueChange={(val) =>
                  onMoveToParent(val === "ROOT" ? null : val)
                }
              >
                <SelectTrigger className="h-8 text-xs w-full">
                  <SelectValue placeholder="[顶级根节点]">
                    {currentParentLabel}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-[220px]">
                  <SelectItem value="ROOT" className="text-xs font-semibold">
                    [顶级根节点] (分区标头建议置于最顶级)
                  </SelectItem>
                  {availableParentGroups
                    .filter((g) => g.id !== selectedNode.id)
                    .map((g) => (
                      <SelectItem key={g.id} value={g.id} className="text-xs">
                        {"— ".repeat(g.depth)} 📁 {g.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <div className="text-[10px] text-muted-foreground truncate px-0.5">
                层级: {selectedNode.parentId ? "子分区" : "顶级独立分区标头"}
              </div>
            </div>
          </>
        )}
      </div>

      {/* 第二行：图标、展示开关与受保护提示 (紧凑且从容宽阔) */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-border/50 text-xs">
        <div className="flex items-center gap-3">
          {selectedNode.itemType === "SECTION" ? (
            <span className="text-[11px] text-muted-foreground italic">
              📌 分区标头为纯文本视觉分隔线，无需设置图标
            </span>
          ) : (
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground shrink-0">
                显示图标:
              </Label>
              <IconPicker
                value={selectedNode.customIcon || ""}
                onChange={(val) => onUpdateNode({ customIcon: val || null })}
                className="w-56 sm:w-64 h-8 text-xs"
              />
              {selectedNode.customIcon && (
                <button
                  type="button"
                  className="text-[11px] text-muted-foreground hover:text-foreground underline shrink-0"
                  onClick={() => onUpdateNode({ customIcon: null })}
                >
                  重置
                </button>
              )}
            </div>
          )}

          {selectedNode.itemType === "LINK" && (
            <div className="flex items-center gap-1.5 pl-3 border-l border-border/60">
              <Switch
                id="tab-switch"
                checked={selectedNode.openInNewTab !== false}
                onCheckedChange={(checked) =>
                  onUpdateNode({ openInNewTab: checked })
                }
              />
              <Label
                htmlFor="tab-switch"
                className="text-xs text-muted-foreground cursor-pointer"
              >
                新标签页打开
              </Label>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isProtected && (
            <span className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded flex items-center gap-1 font-medium">
              <ShieldCheck className="size-3 text-amber-600 dark:text-amber-400" />
              系统核心受保护（不可删除/隐藏）
            </span>
          )}

          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">
              在侧边栏中展示:
            </Label>
            <Switch
              checked={selectedNode.isVisible !== false}
              disabled={isProtected}
              onCheckedChange={(checked) => onUpdateNode({ isVisible: checked })}
            />
            {isProtected ? (
              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                必须显示
              </span>
            ) : selectedNode.isVisible === false ? (
              <span className="text-[11px] text-muted-foreground">已隐蔽</span>
            ) : (
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                正常显示
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
