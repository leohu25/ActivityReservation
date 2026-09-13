import { salesOrderPageContract } from "./features/sales-order/contract";
import type { TenantFeatureManifest } from "@base/authorization";

export const orderManifest: TenantFeatureManifest = {
    id: "order-center",
    name: "订单中心",
    order: 20,
    navSections: [
        {
            id: "order",
            order: 20,
            items: [
                {
                    id: "group-order-center",
                    label: "订单中心",
                    icon: "ShoppingCart",
                    items: [
                        {
                            id: "order-sales-orders",
                            label: "销售订单",
                            href: "/order/sales-orders",
                            requiredAction: "read",
                            requiredSubject: salesOrderPageContract.subject,
                        },
                    ],
                },
            ],
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
