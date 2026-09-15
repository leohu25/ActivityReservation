import "server-only";
import { StandardAction } from "@base/authorization";
import { toPlainData } from "@base/shared";
import {
 getTenantAdminContext,
 assertTenantAdminAbility,
} from "../../assembly/context";
import { TenantMenuItemSubject } from "./contract";
import { NavManagementService } from "./service";
import type { NavigationConfigData } from "./types";
import type { StandardPageDescriptor } from "@base/authorization";

/**
 * RSC server-only Query: 获取当前租户导航菜单配置
 */
export async function getNavigationConfigQuery(
 availablePages: readonly StandardPageDescriptor[] = [],
): Promise<NavigationConfigData> {
 const { client, ability } = await getTenantAdminContext();
 assertTenantAdminAbility(ability, StandardAction.READ, TenantMenuItemSubject);

 const service = new NavManagementService(client);
 const data = await service.getNavigationConfig(availablePages);

 return toPlainData(data);
}
