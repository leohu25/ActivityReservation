import React from "react";
import { ControlLayout } from "@chenrun/feature-control-admin";

export interface DashboardGroupLayoutProps {
 readonly children: React.ReactNode;
}

/**
 * 控制平面总控后台 (dashboard) 路由组统一布局
 * 引入 @chenrun/feature-control-admin 导出的现代数智风自包含布局外壳
 */
export default function DashboardGroupLayout({
 children,
}: DashboardGroupLayoutProps): React.JSX.Element {
 return <ControlLayout>{children}</ControlLayout>;
}
