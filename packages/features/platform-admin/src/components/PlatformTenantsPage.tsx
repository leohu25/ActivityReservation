import React from "react";
import { getPlatformAdminService } from "../server/auth-runtime";
import { requirePlatformAdminSession } from "../server/session";
import { PlatformTenantsClient } from "./PlatformTenantsClient";

/**
 * 平台租户运维中心页面组件 (Server Component)
 * 仅聚焦多租户物理库生命周期管理、开通弹窗与状态启停切换
 */
export async function PlatformTenantsPage(): Promise<React.JSX.Element> {
 await requirePlatformAdminSession();
 const service = getPlatformAdminService();
 const tenants = await service.listTenants();

 return <PlatformTenantsClient tenants={tenants} />;
}
