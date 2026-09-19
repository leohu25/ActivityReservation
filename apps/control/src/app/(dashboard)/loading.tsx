import React from "react";
import { Card } from "@base/ui";

/**
 * 控制平面总控后台路由组加载骨架
 * Next.js App Router 官方 Instant Loading 状态基线：
 * 路由切换时瞬时响应，避免长时间网络等待导致的白屏阻塞感。
 */
export default function ControlDashboardLoading(): React.JSX.Element {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <div className="space-y-2">
        <div className="h-6 w-48 animate-pulse rounded-lg bg-slate-200/70 dark:bg-slate-800" />
        <div className="h-3.5 w-72 animate-pulse rounded-md bg-slate-200/50 dark:bg-slate-800/70" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="h-24 animate-pulse bg-slate-100/80 dark:bg-slate-800/40" />
        ))}
      </div>

      <Card className="h-80 animate-pulse bg-slate-100/60 dark:bg-slate-800/30" />
    </div>
  );
}
