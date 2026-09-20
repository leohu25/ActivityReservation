"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

export interface MasterDetailShellProps {
  /** 主列表/树侧边栏 (Master) */
  readonly master: ReactNode;
  /** 主从详细信息展示区 (Detail) */
  readonly detail: ReactNode;
  /** 侧边栏宽度，默认 w-72 或 w-80 */
  readonly masterWidth?: string;
  /** 侧边栏标题/头部 */
  readonly masterHeader?: ReactNode;
  /** 详情头部/工具栏 */
  readonly detailHeader?: ReactNode;
  /** 详情底部操作栏 */
  readonly detailFooter?: ReactNode;
  /** 外部容器类名 */
  readonly className?: string;
  /** 当无选中项时的占位元素 */
  readonly emptyDetail?: ReactNode;
  /** 是否存在选中的 Detail */
  readonly hasSelected?: boolean;
}

/**
 * Level 3 模板：标准企业级主从 (Master-Detail) 联动布局骨架。
 * 遵循三层 UI 规范，沉淀自组织树、分类树、物料详情、配置中心等经典二栏分栏模式。
 */
export function MasterDetailShell({
  master,
  detail,
  masterWidth = "w-80",
  masterHeader,
  detailHeader,
  detailFooter,
  className,
  emptyDetail,
  hasSelected = true,
}: MasterDetailShellProps) {
  return (
    <div
      className={cn(
        "flex flex-col md:flex-row h-full w-full min-h-[500px] border rounded-lg bg-background overflow-hidden",
        className,
      )}
    >
      {/* Master 侧面板 */}
      <aside
        className={cn(
          "shrink-0 border-b md:border-b-0 md:border-r bg-muted/20 flex flex-col min-w-0 overflow-hidden",
          masterWidth,
        )}
      >
        {masterHeader ? (
          <div className="h-12 px-4 border-b border-border/80 bg-card shrink-0 flex items-center justify-between">
            {masterHeader}
          </div>
        ) : null}
        <div className="flex-1 overflow-y-auto p-2">{master}</div>
      </aside>

      {/* Detail 主展示区 */}
      <main className="flex-1 flex flex-col min-w-0 bg-background overflow-hidden">
        {detailHeader ? (
          <div className="h-12 px-4 border-b border-border/80 bg-card shrink-0 flex items-center justify-between">
            {detailHeader}
          </div>
        ) : null}

        <div className="flex-1 overflow-y-auto p-4">
          {hasSelected ? detail : emptyDetail || null}
        </div>

        {detailFooter ? (
          <div className="px-6 py-3 border-t bg-muted/10 shrink-0 flex items-center justify-end gap-2">
            {detailFooter}
          </div>
        ) : null}
      </main>
    </div>
  );
}
