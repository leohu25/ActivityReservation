"use client";

import React, { type ReactNode } from "react";
import { Inbox } from "lucide-react";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "../shadcn/empty";
import { cn } from "../../lib/utils";

export interface EmptyStateProps {
  /** 提示图标，默认 Inbox */
  icon?: ReactNode;
  /** 主标题 */
  title?: string;
  /** 补充描述 */
  description?: string;
  /** 底部操作插槽 */
  action?: ReactNode;
  className?: string;
}

/**
 * 空状态：基于 shadcn Empty 官方组合，禁止手写居中虚线卡片。
 */
export function EmptyState({
  icon,
  title = "暂无数据",
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <Empty className={cn("min-h-[260px] border border-dashed", className)}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          {icon ?? <Inbox className="size-6 text-muted-foreground" />}
        </EmptyMedia>
        <EmptyTitle className="text-sm">{title}</EmptyTitle>
        {description ? (
          <EmptyDescription className="text-xs">{description}</EmptyDescription>
        ) : null}
      </EmptyHeader>
      {action}
    </Empty>
  );
}
