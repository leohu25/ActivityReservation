import { StandardAction } from "@base/authorization";
import { salesOrderPageContract } from "./features/sales-order/contract";
import type { TenantFeatureManifest } from "@base/authorization";

export const orderManifest: TenantFeatureManifest = {
  id: "order-center",
  name: "订单中心",
  pages: [
    {
      pageKey: "order-sales-orders",
      defaultLabel: "销售订单",
      href: "/order/sales-orders",
      defaultIcon: "ShoppingCart",
      requiredAction: StandardAction.READ,
      requiredSubject: salesOrderPageContract.subject,
    },
  ],
  permissionModules: [
    {
      moduleKey: "order",
      label: "订单中心",
      iconName: "ShoppingCart",
      order: 20,
      pages: [salesOrderPageContract],
    },
  ],
};
