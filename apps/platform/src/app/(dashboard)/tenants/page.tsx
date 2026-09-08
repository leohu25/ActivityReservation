import React from "react";
import { PlatformTenantsPage } from "@chenrun/feature-platform-admin";

export const dynamic = "force-dynamic";

/**
 * 平台总控 - 租户运维中心页面 (极薄装配挂载点)
 */
export default function TenantsRoute(): React.JSX.Element {
  return <PlatformTenantsPage />;
}
