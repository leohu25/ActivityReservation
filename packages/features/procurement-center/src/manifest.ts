import {
    DEPT_DATA_SCOPES,
    STANDARD_DATA_SCOPES,
    type TenantFeatureManifest,
} from "@chenrun/authorization";
import {
    ProcurementPermission,
    ProcurementSubject,
    procurementConfigurableFields,
    procurementPermissionDefinition,
} from "./permissions";

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
                    requiredSubject: ProcurementSubject,
                },
            ],
        },
    ],
    permissions: [procurementPermissionDefinition],
    permissionModules: [
        {
            moduleKey: "procurement",
            label: "采购订单中心",
            iconName: "PackageCheck",
            order: 20,
            pages: [
                {
                    resource: ProcurementPermission.order.resource,
                    subject: ProcurementSubject,
                    label: "采购订单管理",
                    path: "/procurement/orders",
                    actions: [
                        {
                            action: "read",
                            label: "查看单据",
                            supportedScopes: STANDARD_DATA_SCOPES,
                        },
                        {
                            action: "create",
                            label: "新建采购",
                        },
                        {
                            action: "update",
                            label: "修改单据",
                            supportedScopes: STANDARD_DATA_SCOPES,
                        },
                        {
                            action: "audit",
                            label: "单据审核",
                            supportedScopes: DEPT_DATA_SCOPES,
                        },
                        {
                            action: "export",
                            label: "数据导出",
                            supportedScopes: STANDARD_DATA_SCOPES,
                        },
                    ],
                    configurableFields: procurementConfigurableFields.map(
                        (f) => ({
                            field: f.field,
                            label: f.label,
                            sensitive: f.isSensitive,
                        }),
                    ),
                },
            ],
        },
    ],
};
