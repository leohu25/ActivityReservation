import {
	StandardAction,
	type FeaturePagePermissionDescriptor,
} from "@base/authorization";

export const ProductSubject = "Product";
export type ProductSubject = typeof ProductSubject;

export const ProductCategorySubject = "ProductCategory";
export type ProductCategorySubject = typeof ProductCategorySubject;

export const UnitOfMeasureSubject = "UnitOfMeasure";
export type UnitOfMeasureSubject = typeof UnitOfMeasureSubject;

export const ProductAction = {
	...StandardAction,
} as const;

export const productPageContract: FeaturePagePermissionDescriptor = {
	resource: "product_center.product",
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
