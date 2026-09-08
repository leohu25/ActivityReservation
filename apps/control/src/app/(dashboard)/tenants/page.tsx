import React from "react";
import { TenantsPage } from "@chenrun/feature-control-admin";

export const dynamic = "force-dynamic";

/**
 * 控制平面 - 租户运维中心页面 (极薄装配挂载点)
 */
export default function TenantsRoute(): Promise<React.JSX.Element> {
 return TenantsPage();
}
