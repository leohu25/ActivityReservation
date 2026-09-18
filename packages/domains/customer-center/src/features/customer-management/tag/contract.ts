import {
	StandardAction,
	type FeaturePagePermissionDescriptor,
} from "@base/authorization";
import { defineListSearchParams } from "@base/ui";

/**
 * 业务标签 URL 列表参数契约
 */
export const customerTagSearchParams = defineListSearchParams({
	tagType: "",
	status: "",
});
export type CustomerTagSearchParams = Awaited<
	ReturnType<typeof customerTagSearchParams.parse>
>;

/** 客户业务标签主数据实体与资源标识 (SSoT) */
export const CustomerTagSubject = "CustomerTag";
export type CustomerTagSubject = typeof CustomerTagSubject;
export const CustomerTagResource = "customer.tag";
export type CustomerTagResource = typeof CustomerTagResource;

export const CustomerTagAction = {
	...StandardAction,
	TOGGLE_STATUS: "toggle_status",
} as const;

export const CustomerTagField = {
	NAME: "name",
	TAG_TYPE: "tagType",
	DESCRIPTION: "description",
	STATUS: "status",
} as const;

/** 客户标签受控字段元数据定义 */
export const customerTagConfigurableFields = [
	{ field: CustomerTagField.NAME, label: "标签名称", sensitive: false },
	{ field: CustomerTagField.TAG_TYPE, label: "标签业务类型", sensitive: false },
	{
		field: CustomerTagField.DESCRIPTION,
		label: "业务描述说明",
		sensitive: false,
	},
	{ field: CustomerTagField.STATUS, label: "标签状态", sensitive: false },
] as const;

export const customerTagPageContract: FeaturePagePermissionDescriptor = {
	resource: CustomerTagResource,
	subject: CustomerTagSubject,
	label: "客户标签",
	path: "/customer/tags",
	actions: [
		{ action: StandardAction.READ, label: "查看标签" },
		{ action: StandardAction.CREATE, label: "新建标签" },
		{ action: StandardAction.UPDATE, label: "修改标签" },
		{ action: StandardAction.DELETE, label: "删除标签" },
		{ action: CustomerTagAction.TOGGLE_STATUS, label: "启用/停用标签" },
	],
	configurableFields: customerTagConfigurableFields.map((f) => ({
		field: f.field,
		label: f.label,
		sensitive: f.sensitive,
	})),
} as const;
