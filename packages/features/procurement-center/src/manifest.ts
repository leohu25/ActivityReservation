import type { TenantFeatureManifest } from "@chenrun/authorization";
import { procurementOrderPageContract } from "./contracts";

export const procurementManifest: TenantFeatureManifest = {
    id: "procurement-center",
    name: "采购中心",
    order: 20,
    navSections: [
        {
            id: "biz",
            title: "业务中心",
            order: 20,
            items: [
                {
                    id: "procurement",
                    label: "采购订单中心",
                    href: "/procurement/orders",
                    icon: "PackageCheck",
                    requiredAction: "read",
                    requiredSubject: procurementOrderPageContract.subject,
                },
            ],
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
