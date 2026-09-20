"use client";

import React, { useMemo } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Input,
  Badge,
} from "@base/ui";
import { Layers, Search, FileText, Plus, ShieldCheck } from "lucide-react";
import type { StandardPageDescriptor } from "@base/authorization";

export interface AvailablePagePoolProps {
  readonly categorizedPages: readonly {
    featureId: string;
    featureName: string;
    pages: StandardPageDescriptor[];
  }[];
  readonly poolSearch: string;
  readonly onSearchChange: (val: string) => void;
  readonly pageMountCounts: ReadonlyMap<string, number>;
  readonly onMountPage: (page: StandardPageDescriptor) => void;
}

export function AvailablePagePool({
  categorizedPages,
  poolSearch,
  onSearchChange,
  pageMountCounts,
  onMountPage,
}: AvailablePagePoolProps) {
  const totalCount = useMemo(() => {
    return categorizedPages.reduce((sum, c) => sum + c.pages.length, 0);
  }, [categorizedPages]);

  return (
    <Card className="border border-border/80 shadow-xs flex flex-col">
      {/* 紧凑顶栏：标题、总数与搜索框同行一体化 */}
      <CardHeader className="py-2.5 px-4 border-b border-border/60 bg-card">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <Layers className="size-4 text-primary" />
            <CardTitle className="text-xs font-semibold">
              功能页面池
            </CardTitle>
            <Badge
              variant="secondary"
              className="text-[10px] font-mono h-4 px-1.5"
            >
              共 {totalCount} 个功能
            </Badge>
          </div>

          <div className="relative w-64 sm:w-80">
            <Search className="absolute left-2.5 top-2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="搜索功能页面或路径..."
              value={poolSearch}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-7 pl-8 text-xs bg-background"
            />
          </div>
        </div>
      </CardHeader>

      {/* 展开式内容网格：自适应多列，充实可视操作区 */}
      <CardContent className="p-3.5 max-h-[calc(100vh-320px)] min-h-[380px] overflow-y-auto space-y-3.5 bg-card">
        {categorizedPages.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted-foreground">
            未检索到匹配的功能页面
          </div>
        ) : (
          categorizedPages.map((cat) => (
            <div key={cat.featureId} className="space-y-1.5">
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-0.5 flex items-center justify-between">
                <span>{cat.featureName}</span>
                <span className="text-[10px] font-mono">
                  ({cat.pages.length})
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-2.5">
                {cat.pages.map((p) => {
                  const mountCount = pageMountCounts.get(p.pageKey) ?? 0;
                  return (
                    <div
                      key={p.pageKey}
                      onClick={() => onMountPage(p)}
                      className="group flex items-center justify-between p-2 rounded-md border border-border/70 bg-muted/15 hover:bg-accent/40 hover:border-primary/50 cursor-pointer transition-colors select-none"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <FileText className="size-3.5 text-muted-foreground shrink-0 group-hover:text-primary" />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-medium truncate flex items-center gap-1.5">
                            <span className="truncate">{p.defaultLabel}</span>
                            {p.isProtected ? (
                              <Badge
                                variant="outline"
                                className="text-[9px] px-1 py-0 h-3.5 border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10 flex items-center gap-0.5 shrink-0"
                              >
                                <ShieldCheck className="size-2.5" />
                                保护
                              </Badge>
                            ) : p.isSystem ? (
                              <Badge
                                variant="outline"
                                className="text-[9px] px-1 py-0 h-3.5 border-blue-500/40 text-blue-600 dark:text-blue-400 bg-blue-500/10 shrink-0"
                              >
                                系统
                              </Badge>
                            ) : null}
                          </div>
                          <div
                            className="text-[10px] text-muted-foreground truncate font-mono"
                            title={p.href}
                          >
                            {p.href}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-1.5">
                        {mountCount > 0 ? (
                          <Badge
                            variant="secondary"
                            className="text-[9px] px-1 py-0 h-4 shrink-0"
                          >
                            已挂载 {mountCount}
                          </Badge>
                        ) : null}
                        <div className="size-5 rounded flex items-center justify-center bg-primary/10 text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <Plus className="size-3" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
