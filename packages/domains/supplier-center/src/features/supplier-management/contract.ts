import {
	StandardAction,
	type FeaturePagePermissionDescriptor,
} from "@base/authorization";

export const SupplierSubject = "Supplier";
export type SupplierSubject = typeof SupplierSubject;
export const SupplierResource = "supplier_center.supplier";
export type SupplierResource = typeof SupplierResource;

export const SupplierProductSubject = "SupplierProduct";
export type SupplierProductSubject = typeof SupplierProductSubject;
export const SupplierProductResource = "supplier_center.supplier_product";
export type SupplierProductResource = typeof SupplierProductResource;

export const SupplierAction = {
	...StandardAction,
} as const;

export const supplierPageContract: FeaturePagePermissionDescriptor = {
	resource: SupplierResource,
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

export const supplierProductPageContract: FeaturePagePermissionDescriptor = {
	resource: SupplierProductResource,
	subject: SupplierProductSubject,
	label: "供应商物料供应目录",
	path: "/supplier/products",
	actions: [
		{ action: StandardAction.READ, label: "查看供应物料" },
		{ action: StandardAction.CREATE, label: "维护供应物料" },
		{ action: StandardAction.UPDATE, label: "修改供应物料" },
		{ action: StandardAction.DELETE, label: "移除供应物料" },
	],
};
