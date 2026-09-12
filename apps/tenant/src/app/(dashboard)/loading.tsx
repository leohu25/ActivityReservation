import React from "react";
import { Card } from "@base/ui";

/**
 * 租户端后台路由组加载骨架
 * 客户端路由跳转（next/link）期间即时替换内容区，避免旧页面停留造成的“卡顿错觉”；
 * 侧边栏与顶栏由布局持续挂载，不参与本次替换，因此菜单展开状态保持不变。
 */
export default function DashboardLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <div className="space-y-2">
        <div className="h-6 w-48 animate-pulse rounded-lg bg-slate-200/70 dark:bg-slate-800" />
        <div className="h-3.5 w-72 animate-pulse rounded-md bg-slate-200/50 dark:bg-slate-800/70" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="h-24 animate-pulse bg-slate-100/80" />
        ))}
      </div>

      <Card className="h-80 animate-pulse bg-slate-100/60" />
    </div>
  );
}
