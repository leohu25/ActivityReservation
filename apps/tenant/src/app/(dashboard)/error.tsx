"use client";

import React, { useEffect } from "react";
import { AlertCircle, RefreshCw, Home, ShieldAlert } from "lucide-react";
import { Button, Card } from "@base/ui";

interface ErrorPageProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

/**
 * 租户应用全局优雅错误兜底边界 (Friendly Error Boundary)
 * 拒绝裸抛红屏堆栈，提供工业级友好排查提示与一键自愈引导
 */
export default function TenantGlobalError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // 仅在控制台静默记录真实错误，供开发者调试查看
    console.error("[Tenant Boundary Caught]:", error);
  }, [error]);

  const isDev = process.env.NODE_ENV === "development";
  const errorMessage = error.message || "系统遇到了未预期的错误，请稍后重试。";

  return (
    <div className="flex min-h-[80vh] w-full items-center justify-center p-4">
      <Card className="max-w-lg w-full rounded-2xl border border-border/80 p-6 shadow-sm bg-card">
        <div className="flex items-start gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <ShieldAlert className="size-5" />
          </div>
          <div className="flex-1 space-y-1.5 min-w-0">
            <h2 className="text-base font-bold tracking-tight text-foreground flex items-center gap-2">
              <span>系统运行异常</span>
              {error.digest && (
                <span className="font-mono text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  #{error.digest.slice(0, 8)}
                </span>
              )}
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              当前页面在加载或执行操作时受到阻断。系统已自动捕获该异常并保护数据安全。
            </p>
          </div>
        </div>

        {/* 错误人话提示区 */}
        <div className="mt-4 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive flex items-start gap-2">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <div className="font-medium break-all">{errorMessage}</div>
        </div>

        {/* 开发者诊断详情 (仅在开发环境可展开查看) */}
        {isDev && error.stack && (
          <details className="mt-3 text-[11px] text-muted-foreground">
            <summary className="cursor-pointer font-medium hover:text-foreground select-none">
              点击展开开发者技术堆栈 (Debug Info)
            </summary>
            <pre className="mt-2 max-h-40 overflow-auto rounded-lg bg-muted/60 p-2.5 font-mono text-[10px] leading-tight text-muted-foreground/90">
              {error.stack}
            </pre>
          </details>
        )}

        {/* 操作引导区 */}
        <div className="mt-6 flex items-center justify-end gap-2.5 pt-3 border-t border-border/60">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.assign("/workbench")}
            className="h-8 gap-1.5 text-xs cursor-pointer"
          >
            <Home className="size-3.5" />
            <span>返回工作台</span>
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => reset()}
            className="h-8 gap-1.5 text-xs cursor-pointer bg-primary text-primary-foreground"
          >
            <RefreshCw className="size-3.5" />
            <span>尝试重新加载</span>
          </Button>
        </div>
      </Card>
    </div>
  );
}
