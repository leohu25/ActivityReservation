"use client";

import React, { type ReactNode } from "react";
import { FeedbackBanner } from "../feedback/FeedbackBanner";
import { cn } from "../../lib/utils";

export interface PageShellProps {
  readonly title: string;
  readonly description?: string;
  readonly icon?: ReactNode;
  /** 右上角主操作区 */
  readonly actions?: ReactNode;
  /** 页内反馈（success/error/info） */
  readonly feedback?: {
    type: "success" | "error" | "info";
    message: string;
  } | null;
  readonly onDismissFeedback?: () => void;
  readonly children: ReactNode;
  readonly className?: string;
  /** 内容区最大宽度，设置类页面常用 max-w-4xl */
  readonly contentClassName?: string;
}

/**
 * 非列表页统一壳：页头（图标+标题+描述+操作）+ 反馈条 + 内容。
 * 字典/树/设置等页面复用，禁止各 View 手写同款 h1 结构。
 */
export function PageShell({
  title,
  description,
  icon,
  actions,
  feedback,
  onDismissFeedback,
  children,
  className,
  contentClassName,
}: PageShellProps) {
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-foreground">
            {icon}
            <span>{title}</span>
          </h1>
          {description ? (
            <p className="text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        ) : null}
      </div>

      {feedback ? (
        <FeedbackBanner
          type={feedback.type}
          message={feedback.message}
          onDismiss={onDismissFeedback}
        />
      ) : null}

      <div className={contentClassName}>{children}</div>
    </div>
  );
}
