import React from "react";
import { getControlAdminService } from "../server/auth-runtime";
import { requireControlAdminSession } from "../server/session";
import { TenantsView } from "./TenantsView";

/**
 * 控制平面租户运维中枢页面组件 (Server Component)
 * 仅聚焦多租户物理库生命周期管理、开通弹窗与状态启停切换
 */
export async function TenantsPage(): Promise<React.JSX.Element> {
 await requireControlAdminSession();
 const service = getControlAdminService();
 const tenants = await service.listTenants();

 return <TenantsView tenants={tenants} />;
}
