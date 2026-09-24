import {
	StandardAction,
	type FeaturePagePermissionDescriptor,
} from "@base/authorization";

export const ProductSubject = "Product";
export type ProductSubject = typeof ProductSubject;
export const ProductResource = "product_center.product";
export type ProductResource = typeof ProductResource;

export const ProductCategorySubject = "ProductCategory";
export type ProductCategorySubject = typeof ProductCategorySubject;
export const ProductCategoryResource = "product_center.product_category";
export type ProductCategoryResource = typeof ProductCategoryResource;

export const UnitOfMeasureSubject = "UnitOfMeasure";
export type UnitOfMeasureSubject = typeof UnitOfMeasureSubject;
export const UnitOfMeasureResource = "product_center.unit_of_measure";
export type UnitOfMeasureResource = typeof UnitOfMeasureResource;

export const ProductAction = {
	...StandardAction,
} as const;

export const productPageContract: FeaturePagePermissionDescriptor = {
	resource: ProductResource,
	subject: ProductSubject,
	label: "商品物料档案",
	path: "/product/master",
	actions: [
		{ action: StandardAction.READ, label: "查看商品" },
		{ action: StandardAction.CREATE, label: "新建商品" },
		{ action: StandardAction.UPDATE, label: "修改商品" },
		{ action: StandardAction.DELETE, label: "删除商品" },
		{ action: StandardAction.EXPORT, label: "导出商品" },
	],
};

export const productCategoryPageContract: FeaturePagePermissionDescriptor = {
	resource: ProductCategoryResource,
	subject: ProductCategorySubject,
	label: "商品物料分类",
	path: "/product/categories",
	actions: [
		{ action: StandardAction.READ, label: "查看分类" },
		{ action: StandardAction.CREATE, label: "新建分类" },
		{ action: StandardAction.UPDATE, label: "修改分类" },
		{ action: StandardAction.DELETE, label: "删除分类" },
	],
};

export const unitOfMeasurePageContract: FeaturePagePermissionDescriptor = {
	resource: UnitOfMeasureResource,
	subject: UnitOfMeasureSubject,
	label: "计量单位管理",
	path: "/product/units",
	actions: [
		{ action: StandardAction.READ, label: "查看单位" },
		{ action: StandardAction.CREATE, label: "新建单位" },
		{ action: StandardAction.UPDATE, label: "修改单位" },
		{ action: StandardAction.DELETE, label: "删除单位" },
	],
};
