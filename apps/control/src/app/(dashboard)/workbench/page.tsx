import React from "react";
import { OverviewView } from "@base/feature-control-admin/platform-overview";
import { getControlStatsQuery } from "@base/feature-control-admin/platform-overview/server";

export const dynamic = "force-dynamic";

/**
 * 控制平面 - 运营与指标大盘页面 (极薄装配挂载点)
 */
export default async function OverviewRoute(): Promise<React.JSX.Element> {
 const stats = await getControlStatsQuery();
 return <OverviewView stats={stats} />;
}
