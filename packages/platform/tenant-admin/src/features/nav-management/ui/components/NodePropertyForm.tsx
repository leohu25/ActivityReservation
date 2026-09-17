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
  return (
    <div className="space-y-3.5">
      {/* 类型 1：系统功能页面 */}
      {selectedNode.itemType === "PAGE" && (
        <>
          <div className="grid grid-cols-12 gap-3 items-center">
            <Label className="col-span-3 text-xs font-medium text-muted-foreground">
              关联系统功能:
            </Label>
            <div className="col-span-9 space-y-1">
              <Select
                value={selectedNode.pageKey || ""}
                onValueChange={(val) => {
                  if (val) onSelectPageKey(val);
                }}
              >
                <SelectTrigger className="h-8 text-xs font-medium">
                  <SelectValue placeholder="选择要绑定的业务功能页面..." />
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

              {selectedNode.pageKey && (
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-muted/20 px-2 py-1 rounded border border-border/50">
                  <span className="font-semibold text-foreground">
                    物理路由:
                  </span>
                  <code className="font-mono text-primary text-[11px]">
                    {pageMap.get(selectedNode.pageKey)?.href ||
                      selectedNode.pageKey}
                  </code>
                  <span className="text-muted-foreground ml-auto">
                    所属: {pageMap.get(selectedNode.pageKey)?.featureName}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-12 gap-3 items-center">
            <Label className="col-span-3 text-xs font-medium text-muted-foreground">
              菜单显示别名:
            </Label>
            <div className="col-span-9">
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
                    : "输入显示别名"
                }
                className="h-8 text-xs font-medium"
                onChange={(e) =>
                  onUpdateNode({
                    customLabel: e.target.value.trim() ? e.target.value : null,
                  })
                }
              />
              {selectedNode.pageKey && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  系统出厂默认名称为：
                  <span className="font-medium text-foreground">
                    {pageMap.get(selectedNode.pageKey)?.defaultLabel}
                  </span>
                  （清空则自动回退默认名）
                </p>
              )}
            </div>
          </div>
        </>
      )}

      {/* 类型 2：外部系统链接 */}
      {selectedNode.itemType === "LINK" && (
        <>
          <div className="grid grid-cols-12 gap-3 items-center">
            <Label className="col-span-3 text-xs font-medium text-muted-foreground">
              外部链接地址:
            </Label>
            <div className="col-span-9">
              <Input
                value={selectedNode.externalUrl || ""}
                placeholder="https://example.com 或 http://oa.company.com"
                className="h-8 text-xs font-mono"
                onChange={(e) => onUpdateNode({ externalUrl: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-12 gap-3 items-center">
            <Label className="col-span-3 text-xs font-medium text-muted-foreground">
              链接显示名称:
            </Label>
            <div className="col-span-9">
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
            </div>
          </div>

          <div className="grid grid-cols-12 gap-3 items-center">
            <Label className="col-span-3 text-xs font-medium text-muted-foreground">
              新窗口打开:
            </Label>
            <div className="col-span-9 flex items-center gap-2">
              <Switch
                checked={selectedNode.openInNewTab !== false}
                onCheckedChange={(checked) =>
                  onUpdateNode({ openInNewTab: checked })
                }
              />
              <span className="text-xs text-muted-foreground">
                {selectedNode.openInNewTab === false
                  ? "在当前标签页中直接跳转"
                  : "在新浏览器标签页中打开 (推荐)"}
              </span>
            </div>
          </div>
        </>
      )}

      {/* 类型 3：多级目录分组 */}
      {selectedNode.itemType === "GROUP" && (
        <div className="grid grid-cols-12 gap-3 items-center">
          <Label className="col-span-3 text-xs font-medium text-muted-foreground">
            目录分组名称:
          </Label>
          <div className="col-span-9">
            <Input
              value={selectedNode.customLabel || ""}
              placeholder="输入大目录名称，如：采购协同中心"
              className="h-8 text-xs font-medium"
              onChange={(e) =>
                onUpdateNode({
                  customLabel: e.target.value.trim() ? e.target.value : null,
                })
              }
            />
          </div>
        </div>
      )}

      {/* 公共属性：自定义图标 */}
      <div className="grid grid-cols-12 gap-3 items-center">
        <Label className="col-span-3 text-xs font-medium text-muted-foreground">
          显示图标:
        </Label>
        <div className="col-span-9 flex items-center gap-2">
          <IconPicker
            value={selectedNode.customIcon || ""}
            onChange={(val) => onUpdateNode({ customIcon: val || null })}
            className="w-48 h-8 text-xs"
          />
          {selectedNode.customIcon && (
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground underline"
              onClick={() => onUpdateNode({ customIcon: null })}
            >
              清除自定义
            </button>
          )}
        </div>
      </div>

      {/* 公共属性：所属父级目录 (支持移入移出) */}
      <div className="grid grid-cols-12 gap-3 items-center">
        <Label className="col-span-3 text-xs font-medium text-muted-foreground">
          所属父级目录:
        </Label>
        <div className="col-span-9">
          <Select
            value={selectedNode.parentId || "ROOT"}
            onValueChange={(val) => onMoveToParent(val === "ROOT" ? null : val)}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="作为顶级菜单项" />
            </SelectTrigger>
            <SelectContent className="max-h-[220px]">
              <SelectItem value="ROOT" className="text-xs font-semibold">
                [顶级根节点] (不归属于任何目录)
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
        </div>
      </div>

      {/* 公共属性：可见性开关 */}
      <div className="grid grid-cols-12 gap-3 items-center">
        <Label className="col-span-3 text-xs font-medium text-muted-foreground">
          在导航树中展示:
        </Label>
        <div className="col-span-9 flex items-center gap-2">
          <Switch
            checked={selectedNode.isVisible !== false}
            onCheckedChange={(checked) => onUpdateNode({ isVisible: checked })}
          />
          <span className="text-xs text-muted-foreground">
            {selectedNode.isVisible === false
              ? "已隐蔽，仅供特定路由直达或权限保留"
              : "显示在左侧边栏导航中"}
          </span>
        </div>
      </div>
    </div>
  );
}
