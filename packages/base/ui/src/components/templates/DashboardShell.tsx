"use client";

import React from "react";
import { SidebarProvider, SidebarInset } from "../shadcn/sidebar";

export interface DashboardShellProps {
  readonly children: React.ReactNode;
  readonly header: React.ReactNode;
  readonly sidebar: React.ReactNode;
}

/**
 * ERP 统一后台主容器 Shell
 * 基于官方 shadcn SidebarProvider + SidebarInset 组合。
 */
export function DashboardShell({
  children,
  header,
  sidebar,
}: DashboardShellProps) {
  return (
    <SidebarProvider className="min-h-svh">
      <div className="flex min-h-svh w-full flex-col bg-background font-sans text-foreground">
        {header}
        <div className="flex min-h-0 flex-1 overflow-hidden">
          {sidebar}
          <SidebarInset className="min-w-0 flex-1 overflow-y-auto bg-background p-6 md:p-8">
            {children}
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
