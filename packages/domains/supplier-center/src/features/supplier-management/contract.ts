import {
	StandardAction,
	type FeaturePagePermissionDescriptor,
} from "@base/authorization";

export const SupplierSubject = "Supplier";
export type SupplierSubject = typeof SupplierSubject;

export const SupplierProductSubject = "SupplierProduct";
export type SupplierProductSubject = typeof SupplierProductSubject;

export const SupplierAction = {
	...StandardAction,
} as const;

export const supplierPageContract: FeaturePagePermissionDescriptor = {
	resource: "supplier_center.supplier",
	subject: SupplierSubject,
	label: "供应商档案",
	path: "/supplier/master",
	actions: [
		{ action: StandardAction.READ, label: "查看供应商" },
		{ action: StandardAction.CREATE, label: "新建供应商" },
		{ action: StandardAction.UPDATE, label: "修改供应商" },
		{ action: StandardAction.DELETE, label: "删除供应商" },
		{ action: StandardAction.EXPORT, label: "导出供应商" },
	],
};
