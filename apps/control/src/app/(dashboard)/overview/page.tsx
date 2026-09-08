import React from "react";
import { OverviewPage } from "@chenrun/feature-control-admin";

export const dynamic = "force-dynamic";

/**
 * 控制平面 - 运营与指标大盘页面 (极薄装配挂载点)
 */
export default function OverviewRoute(): Promise<React.JSX.Element> {
 return OverviewPage();
}
