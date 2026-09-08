import React from "react";
import { PlatformOverviewPage } from "@chenrun/feature-platform-admin";

export const dynamic = "force-dynamic";

/**
 * 平台总控 - 运营与指标大盘页面 (极薄装配挂载点)
 */
export default function OverviewRoute(): React.JSX.Element {
  return <PlatformOverviewPage />;
}
