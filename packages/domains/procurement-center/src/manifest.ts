import { StandardAction } from "@base/authorization";
import type { TenantFeatureManifest } from "@base/authorization";
import { procurementOrderPageContract } from "./contracts";

export const procurementManifest: TenantFeatureManifest = {
  id: "procurement-center",
  name: "采购中心",
  pages: [
    {
      pageKey: "procurement-orders",
      defaultLabel: "采购订单中心",
      href: "/procurement/orders",
      defaultIcon: "PackageCheck",
      requiredAction: StandardAction.READ,
      requiredSubject: procurementOrderPageContract.subject,
    },
  ],
  permissionModules: [
    {
      moduleKey: "procurement",
      label: "采购订单中心",
      iconName: "PackageCheck",
      order: 20,
      pages: [
        procurementOrderPageContract, // 👈 统一直接挂载页面纯数据权限契约
      ],
    },
  ],
};
