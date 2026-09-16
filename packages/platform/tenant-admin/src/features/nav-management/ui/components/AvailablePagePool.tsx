"use client";

import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Input,
  Badge,
} from "@base/ui";
import { Layers, Search, FileText, Plus } from "lucide-react";
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
  return (
    <Card className="border-dashed">
      <CardHeader className="py-3 px-4 border-b bg-muted/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Layers className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold">
              业务功能页面池
            </CardTitle>
          </div>
          <Badge variant="outline" className="text-xs">
            点击直接追加
          </Badge>
        </div>
        <CardDescription className="text-xs">
          全仓已注册的业务功能页面。点击任意页面可将其添加到当前选中的目录中。
        </CardDescription>
        <div className="relative mt-2">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="搜索功能页面或路径..."
            value={poolSearch}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-8 pl-8 text-xs"
          />
        </div>
      </CardHeader>
      <CardContent className="p-3 max-h-[280px] overflow-y-auto space-y-4">
        {categorizedPages.length === 0 ? (
          <div className="py-6 text-center text-xs text-muted-foreground">
            未检索到匹配的业务功能
          </div>
        ) : (
          categorizedPages.map((cat) => (
            <div key={cat.featureId} className="space-y-1.5">
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
                {cat.featureName} ({cat.pages.length})
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                {cat.pages.map((p) => {
                  const mountCount = pageMountCounts.get(p.pageKey) ?? 0;
                  return (
                    <div
                      key={p.pageKey}
                      onClick={() => onMountPage(p)}
                      className="group flex items-center justify-between p-2 rounded-md border bg-card hover:bg-accent/40 hover:border-primary/40 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0 group-hover:text-primary" />
                        <div className="min-w-0">
                          <div className="text-xs font-medium truncate">
                            {p.defaultLabel}
                          </div>
                          <div className="text-[10px] text-muted-foreground truncate font-mono">
                            {p.href}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        {mountCount > 0 ? (
                          <Badge
                            variant="secondary"
                            className="text-[9px] px-1 py-0 h-4"
                          >
                            已挂载 {mountCount}
                          </Badge>
                        ) : null}
                        <div className="h-5 w-5 rounded flex items-center justify-center bg-primary/10 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                          <Plus className="h-3 w-3" />
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
