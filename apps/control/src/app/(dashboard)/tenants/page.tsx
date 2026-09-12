import React from "react";
import { TenantsView } from "@chenrun/feature-control-admin/tenant-management";
import { listTenantsQuery } from "@chenrun/feature-control-admin/tenant-management/server";

export const dynamic = "force-dynamic";

/**
 * 控制平面 - 租户运维中心页面 (极薄装配挂载点)
 */
export default async function TenantsRoute(): Promise<React.JSX.Element> {
 const tenants = await listTenantsQuery();
 return <TenantsView tenants={tenants} />;
}
