"use client";

import React from "react";

export interface DashboardShellProps {
  readonly children: React.ReactNode;
  readonly header: React.ReactNode;
  readonly sidebar: React.ReactNode;
}

/**
 * ERP 统一后台主容器 Shell
 * 负责整体左右两栏响应式布局，背景底色使用现代轻量冷灰蓝 (#F4F7FB)
 */
export function DashboardShell({
  children,
  header,
  sidebar,
}: DashboardShellProps) {
  return (
    <div className="flex h-screen w-full flex-col bg-[#F4F7FB] dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100">
      {header}
      <div className="flex flex-1 overflow-hidden">
        {sidebar}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
