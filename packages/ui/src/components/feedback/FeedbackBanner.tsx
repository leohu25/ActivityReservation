"use client";

import React from "react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { cn } from "../../lib/utils";

export interface FeedbackBannerProps {
  readonly type: "success" | "error" | "info";
  readonly message: string;
  readonly className?: string;
  readonly onDismiss?: () => void;
}

/** 页内反馈条：替代各 View 手写 emerald/rose 横幅（通知优先仍用 toast） */
export function FeedbackBanner({
  type,
  message,
  className,
  onDismiss,
}: FeedbackBannerProps) {
  const Icon =
    type === "success" ? CheckCircle2 : type === "error" ? AlertCircle : Info;

  return (
    <div
      role="status"
      className={cn(
        "flex items-center gap-2 rounded-xl border p-3.5 text-xs font-semibold",
        type === "success" &&
          "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300",
        type === "error" &&
          "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300",
        type === "info" &&
          "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300",
        className,
      )}
    >
      <Icon
        className={cn(
          "size-4 shrink-0",
          type === "success" && "text-emerald-600 dark:text-emerald-400",
          type === "error" && "text-rose-600 dark:text-rose-400",
          type === "info" && "text-blue-600 dark:text-blue-400",
        )}
      />
      <span className="min-w-0 flex-1">{message}</span>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 text-xs font-medium opacity-60 hover:opacity-100"
        >
          关闭
        </button>
      ) : null}
    </div>
  );
}
