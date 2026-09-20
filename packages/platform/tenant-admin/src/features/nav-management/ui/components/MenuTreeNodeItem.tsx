"use client";

import React from "react";
import { Button } from "@base/ui";
import {
  Folder,
  FileText,
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  Bookmark,
} from "lucide-react";
import { DynamicNavIcon } from "@base/ui";
import type {
  StandardPageDescriptor,
  TenantMenuNode,
} from "@base/authorization";

export interface MenuTreeNodeItemProps {
  readonly node: TenantMenuNode;
  readonly depth?: number;
  readonly selectedNodeId: string;
  readonly expandedNodes: Readonly<Record<string, boolean>>;
  readonly pageMap: ReadonlyMap<string, StandardPageDescriptor>;
  readonly onSelectNode: (id: string) => void;
  readonly onToggleExpand: (id: string) => void;
  readonly onAddChild: (targetNodeId: string) => void;
  readonly onMoveNode: (id: string, direction: "up" | "down") => void;
  readonly onDeleteNode: (id: string) => void;
}

export function MenuTreeNodeItem({
  node,
  depth = 0,
  selectedNodeId,
  expandedNodes,
  pageMap,
  onSelectNode,
  onToggleExpand,
  onAddChild,
  onMoveNode,
  onDeleteNode,
}: MenuTreeNodeItemProps) {
  const hasChildren = Boolean(node.children && node.children.length > 0);
  const isSection = node.itemType === "SECTION";
  const isGroup = node.itemType === "GROUP";
  const isLink = node.itemType === "LINK";
  const isSelected = selectedNodeId === node.id;
  const isExpanded = expandedNodes[node.id] ?? true;
  const pageMeta = node.pageKey ? pageMap.get(node.pageKey) : null;
  const isProtected = Boolean(node.isProtected || pageMeta?.isProtected);
  const labelText =
    node.customLabel || pageMeta?.defaultLabel || node.externalUrl || "未命名";

  return (
    <div key={node.id} className="space-y-0.5">
      <div
        onClick={() => onSelectNode(node.id)}
        style={{ paddingLeft: `${Math.max(6, depth * 14 + 6)}px` }}
        className={`group flex items-center justify-between py-1.5 pr-1.5 rounded-md cursor-pointer text-xs transition-colors select-none ${
          isSelected
            ? "bg-primary/15 text-primary font-medium border border-primary/30"
            : "hover:bg-muted/70 text-foreground"
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {/* 折叠切换图标 */}
          {hasChildren || isGroup || isSection ? (
            <button
              type="button"
              className="p-0.5 hover:bg-muted rounded text-muted-foreground"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand(node.id);
              }}
            >
              {isExpanded ? (
                <ChevronDown className="size-3 text-muted-foreground" />
              ) : (
                <ChevronRight className="size-3 text-muted-foreground" />
              )}
            </button>
          ) : (
            <span className="size-3 inline-block" />
          )}

          {/* 节点类型与图标 */}
          {node.customIcon ? (
            <DynamicNavIcon
              name={node.customIcon}
              className="size-3.5 shrink-0 text-muted-foreground"
            />
          ) : isSection ? (
            <Bookmark className="size-3.5 shrink-0 text-primary" />
          ) : isGroup ? (
            <Folder className="size-3.5 shrink-0 text-amber-500" />
          ) : isLink ? (
            <span className="size-3.5 shrink-0 font-mono text-[10px] text-blue-500">
              🔗
            </span>
          ) : (
            <FileText className="size-3.5 shrink-0 text-muted-foreground" />
          )}

          <span className="truncate flex-1 font-medium">{labelText}</span>

          {isSection && (
            <span className="text-[9px] text-primary bg-primary/10 border border-primary/25 px-1 py-0 rounded shrink-0 font-medium">
              分区标头
            </span>
          )}

          {isProtected && (
            <span className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1 py-0 rounded shrink-0 flex items-center gap-0.5">
              <ShieldCheck className="size-2.5" />
              保护
            </span>
          )}

          {node.isVisible === false && (
            <span className="text-[10px] text-muted-foreground bg-muted px-1 rounded shrink-0">
              隐藏
            </span>
          )}
        </div>

        {/* 节点悬浮快捷操作栏 */}
        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 ml-1 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="size-4 text-muted-foreground hover:text-primary"
            title="添加子项"
            onClick={(e) => {
              e.stopPropagation();
              onAddChild(node.id);
            }}
          >
            <Plus className="size-2.5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="size-4 text-muted-foreground"
            title="上移"
            onClick={(e) => {
              e.stopPropagation();
              onMoveNode(node.id, "up");
            }}
          >
            <ArrowUp className="size-2.5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="size-4 text-muted-foreground"
            title="下移"
            onClick={(e) => {
              e.stopPropagation();
              onMoveNode(node.id, "down");
            }}
          >
            <ArrowDown className="size-2.5" />
          </Button>

          {isProtected ? (
            <Button
              variant="ghost"
              size="icon"
              className="size-4 text-muted-foreground/30 cursor-not-allowed hover:bg-transparent"
              title="系统核心受保护功能不可删除，防止丢失管理入口"
              disabled
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <Trash2 className="size-2.5" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="size-4 text-muted-foreground hover:text-destructive"
              title="删除此项"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteNode(node.id);
              }}
            >
              <Trash2 className="size-2.5" />
            </Button>
          )}
        </div>
      </div>

      {/* 递归子树渲染 */}
      {(hasChildren || isGroup || isSection) && isExpanded && node.children && (
        <div className="space-y-0.5 border-l border-border/40 ml-3">
          {node.children.map((child) => (
            <MenuTreeNodeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedNodeId={selectedNodeId}
              expandedNodes={expandedNodes}
              pageMap={pageMap}
              onSelectNode={onSelectNode}
              onToggleExpand={onToggleExpand}
              onAddChild={onAddChild}
              onMoveNode={onMoveNode}
              onDeleteNode={onDeleteNode}
            />
          ))}
        </div>
      )}
    </div>
  );
}
