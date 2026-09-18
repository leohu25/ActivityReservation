import {
	StandardAction,
	type FeaturePagePermissionDescriptor,
} from "@base/authorization";
import { defineListSearchParams } from "@base/ui";

/**
 * 客户分类 URL 列表参数契约
 */
export const customerCategorySearchParams = defineListSearchParams({
	status: "",
});
export type CustomerCategorySearchParams = Awaited<
	ReturnType<typeof customerCategorySearchParams.parse>
>;

/** 客户分类主数据实体与资源标识 (SSoT) */
export const CustomerCategorySubject = "CustomerCategory";
export type CustomerCategorySubject = typeof CustomerCategorySubject;
export const CustomerCategoryResource = "customer.category";
export type CustomerCategoryResource = typeof CustomerCategoryResource;

export const CustomerCategoryAction = {
	...StandardAction,
	TOGGLE_STATUS: "toggle_status",
} as const;

export const CustomerCategoryField = {
	CATEGORY_CODE: "categoryCode",
	CATEGORY_NAME: "categoryName",
	PARENT_CODE: "parentCode",
	DESCRIPTION: "description",
	STATUS: "status",
} as const;

/** 客户分类受控字段元数据定义 */
export const customerCategoryConfigurableFields = [
	{
		field: CustomerCategoryField.CATEGORY_CODE,
		label: "分类编码",
		sensitive: false,
	},
	{
		field: CustomerCategoryField.CATEGORY_NAME,
		label: "分类名称",
		sensitive: false,
	},
	{
		field: CustomerCategoryField.PARENT_CODE,
		label: "父级分类编码",
		sensitive: false,
	},
	{
		field: CustomerCategoryField.DESCRIPTION,
		label: "业务描述说明",
		sensitive: false,
	},
	{ field: CustomerCategoryField.STATUS, label: "分类状态", sensitive: false },
] as const;

export const customerCategoryPageContract: FeaturePagePermissionDescriptor = {
	resource: CustomerCategoryResource,
	subject: CustomerCategorySubject,
	label: "客户分类",
	path: "/customer/categories",
	actions: [
		{ action: StandardAction.READ, label: "查看分类" },
		{ action: StandardAction.CREATE, label: "新建分类" },
		{ action: StandardAction.UPDATE, label: "修改分类" },
		{ action: StandardAction.DELETE, label: "删除分类" },
		{ action: CustomerCategoryAction.TOGGLE_STATUS, label: "启用/停用分类" },
	],
	configurableFields: customerCategoryConfigurableFields.map((f) => ({
		field: f.field,
		label: f.label,
		sensitive: f.sensitive,
	})),
} as const;
