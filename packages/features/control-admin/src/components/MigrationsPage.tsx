import React from "react";
import { getControlAdminService } from "../server/auth-runtime";
import { requireControlAdminSession } from "../server/session";
import { MigrationsView } from "./MigrationsView";

/**
 * 控制平面数据架构与迁移中枢页面组件 (Server Component)
 */
export async function MigrationsPage(): Promise<React.JSX.Element> {
 const user = await requireControlAdminSession();
 const service = getControlAdminService();
 const dashboardData = await service.getMigrationDashboard(user);

 return <MigrationsView initialData={dashboardData} />;
}
