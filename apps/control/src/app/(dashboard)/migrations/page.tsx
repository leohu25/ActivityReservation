import React from "react";
import { MigrationsView } from "@base/feature-control-admin/migration-management";
import { getMigrationDashboardQuery } from "@base/feature-control-admin/migration-management/server";

export const dynamic = "force-dynamic";

/**
 * 控制平面 - 数据架构与迁移中枢路由挂载点
 */
export default async function MigrationsRoute(): Promise<React.JSX.Element> {
 const dashboardData = await getMigrationDashboardQuery();
 return <MigrationsView data={dashboardData} />;
}
