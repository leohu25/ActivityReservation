"use client";

import React from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { Alert, AlertDescription } from "../shadcn/alert";
import { Button } from "../shadcn/button";
import { cn } from "../../lib/utils";

export interface FeedbackBannerProps {
  readonly type: "success" | "error" | "info";
  readonly message: string;
  readonly className?: string;
  readonly onDismiss?: () => void;
}

/**
 * 页内反馈条：基于 shadcn Alert 组合（通知优先仍用 toast）。
 * 成功/信息用 default + 语义图标色；错误用 destructive variant。
 */
export function FeedbackBanner({
  type,
  message,
  className,
  onDismiss,
}: FeedbackBannerProps) {
  const Icon =
    type === "success" ? CheckCircle2 : type === "error" ? AlertCircle : Info;

  return (
    <Alert
      variant={type === "error" ? "destructive" : "default"}
      className={cn(
        "items-center",
        type === "success" && "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200",
        type === "info" &&
          "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200",
        className,
      )}
    >
      <Icon
        className={cn(
          type === "success" && "text-emerald-600 dark:text-emerald-400",
          type === "info" && "text-blue-600 dark:text-blue-400",
        )}
      />
      <AlertDescription className="font-medium">{message}</AlertDescription>
      {onDismiss ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="col-start-2 h-6 justify-self-end px-2 text-xs opacity-70 hover:opacity-100"
          onClick={onDismiss}
        >
          <X className="size-3" />
          关闭
        </Button>
      ) : null}
    </Alert>
  );
}
