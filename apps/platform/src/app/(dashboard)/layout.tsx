import React from "react";
import { PlatformConsoleLayout } from "@chenrun/feature-platform-admin";

export interface DashboardGroupLayoutProps {
  readonly children: React.ReactNode;
}

/**
 * 平台运营商后台 (dashboard) 路由组统一布局
 * 引入 @chenrun/feature-platform-admin 导出的自包含布局外壳
 */
export default function DashboardGroupLayout({
  children,
}: DashboardGroupLayoutProps): React.JSX.Element {
  return <PlatformConsoleLayout>{children}</PlatformConsoleLayout>;
}
