"use client";

import React from "react";

interface DashboardShellProps {
  readonly children: React.ReactNode;
  readonly header: React.ReactNode;
  readonly sidebar: React.ReactNode;
}

/**
 * ERP 统一后台主容器 Shell
 * 负责整体左右两栏响应式布局
 */
export function DashboardShell({ children, header, sidebar }: DashboardShellProps) {
  return (
    <div className="flex h-screen w-full flex-col bg-zinc-100 dark:bg-zinc-950 font-sans">
      {header}
      <div className="flex flex-1 overflow-hidden">
        {sidebar}
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}
