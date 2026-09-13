"use client";

import React from "react";
import { ChevronRightIcon, Plus } from "lucide-react";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "../../shadcn/collapsible";
import { Button } from "../../shadcn/button";
import { Card } from "../../shadcn/card";
import { cn } from "../../../lib/utils";

export interface TreeNodeData {
  id: string;
  name: string;
  code?: string;
  children?: TreeNodeData[];
  [key: string]: unknown;
}

export interface TreeViewProps<T extends TreeNodeData> {
  data: readonly T[];
  renderTitle?: (node: T, depth: number) => React.ReactNode;
  renderActions?: (node: T, depth: number) => React.ReactNode;
  renderExtra?: (node: T, depth: number) => React.ReactNode;
  onCreateRoot?: () => void;
  createRootText?: string;
  emptyText?: string;
  className?: string;
  defaultExpandedAll?: boolean;
}

/**
 * 平台通用企业级树形组件 (TreeView)
 * - 100% 遵循 shadcn 官方 Tree 标准：基于 Collapsible / CollapsibleTrigger / CollapsibleContent 组合
 * - Radix 原生状态机驱动 group-data-[state=open]:rotate-90 旋转动效
 * - 支持首行常驻快速新建根节点与无限级嵌套行内操作
 */
export function TreeView<T extends TreeNodeData>({
  data,
  renderTitle,
  renderActions,
  renderExtra,
  onCreateRoot,
  createRootText = "新增一级根节点",
  emptyText = "暂无树形数据，点击上方按钮创建第一条根记录",
  className,
  defaultExpandedAll = true,
}: TreeViewProps<T>) {
  const renderItem = (node: T, depth = 0): React.ReactNode => {
    const hasChildren = Boolean(node.children && node.children.length > 0);

    const titleContent = renderTitle ? (
      renderTitle(node, depth)
    ) : (
      <div className="flex items-center gap-2 min-w-0">
        {node.code && (
          <span className="rounded border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-xs font-semibold text-foreground">
            {node.code}
          </span>
        )}
        <span className="truncate text-sm font-medium text-foreground">
          {node.name}
        </span>
      </div>
    );

    if (hasChildren) {
      return (
        <Collapsible key={node.id} defaultOpen={defaultExpandedAll}>
          <div
            style={{ paddingLeft: `${depth * 20 + 12}px` }}
            className="group flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-card p-2.5 transition-colors hover:bg-muted/40 shadow-xs"
          >
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="size-5 rounded flex items-center justify-center text-muted-foreground hover:bg-muted"
                >
                  <ChevronRightIcon className="size-3.5 transition-transform group-data-[state=open]:rotate-90" />
                </button>
              </CollapsibleTrigger>
              {titleContent}
              {renderExtra && renderExtra(node, depth)}
            </div>

            {renderActions && (
              <div className="flex shrink-0 items-center gap-1.5">
                {renderActions(node, depth)}
              </div>
            )}
          </div>

          <CollapsibleContent className="mt-1.5 flex flex-col gap-1.5">
            {node.children!.map((child) => renderItem(child as T, depth + 1))}
          </CollapsibleContent>
        </Collapsible>
      );
    }

    return (
      <div
        key={node.id}
        style={{ paddingLeft: `${depth * 20 + 12}px` }}
        className="group flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-card p-2.5 transition-colors hover:bg-muted/40 shadow-xs"
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="size-5" />
          {titleContent}
          {renderExtra && renderExtra(node, depth)}
        </div>

        {renderActions && (
          <div className="flex shrink-0 items-center gap-1.5">
            {renderActions(node, depth)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn("space-y-2", className)}>
      {onCreateRoot && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCreateRoot}
          className="w-full h-10 border-dashed border-border/90 bg-muted/20 hover:bg-primary/5 hover:border-primary/50 text-muted-foreground hover:text-primary transition-all flex items-center justify-center gap-2 rounded-lg font-medium text-xs"
        >
          <Plus className="size-4" />
          <span>{createRootText}</span>
        </Button>
      )}

      {data.length === 0 ? (
        <Card className="p-8 border border-dashed rounded-lg text-center text-xs text-muted-foreground bg-card/50">
          {emptyText}
        </Card>
      ) : (
        <div className="space-y-1.5">
          {data.map((rootNode) => renderItem(rootNode, 0))}
        </div>
      )}
    </div>
  );
}
