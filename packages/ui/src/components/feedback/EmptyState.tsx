"use client";

import React, { type ReactNode } from "react";
import { Inbox } from "lucide-react";
import { cn } from "../../lib/utils";

export interface EmptyStateProps {
        /** 提示图标，默认显示 Inbox 图标 */
        icon?: ReactNode;
        /** 主标题 */
        title?: string;
        /** 补充描述信息 */
        description?: string;
        /** 底部操作按钮或链接插槽 */
        action?: ReactNode;
        className?: string;
}

export function EmptyState({
        icon = (
                <Inbox className="size-10 text-muted-foreground/60 stroke-[1.5]" />
        ),
        title = "暂无数据",
        description,
        action,
        className,
}: EmptyStateProps) {
        return (
                <div
                        className={cn(
                                "flex min-h-[260px] flex-col items-center justify-center rounded-lg border border-dashed border-border/60 bg-muted/10 p-8 text-center animate-in fade-in-50",
                                className,
                        )}
                >
                        <div className="flex size-14 items-center justify-center rounded-full bg-muted/50 mb-3 text-muted-foreground">
                                {icon}
                        </div>
                        <h3 className="text-sm font-semibold tracking-tight text-foreground">
                                {title}
                        </h3>
                        {description && (
                                <p className="mt-1 max-w-sm text-xs text-muted-foreground leading-relaxed">
                                        {description}
                                </p>
                        )}
                        {action && <div className="mt-4">{action}</div>}
                </div>
        );
}
