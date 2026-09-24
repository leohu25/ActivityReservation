import {
	StandardAction,
	type FeaturePagePermissionDescriptor,
} from "@base/authorization";
import { defineListSearchParams } from "@base/ui";

export * from "./specification/contract";

export const OperationSubject = "Operation";
export type OperationSubject = typeof OperationSubject;

export const OperationResource = "production_center.operation";
export type OperationResource = typeof OperationResource;

export const ProcessAction = {
	...StandardAction,
	TOGGLE_STATUS: "toggle_status",
} as const;
export type ProcessAction = (typeof ProcessAction)[keyof typeof ProcessAction];

export const OperationField = {
	CODE: "code",
	NAME: "name",
	OPERATION_CATEGORY_DICT_ITEM_ID: "operationCategoryDictItemId",
	DEFAULT_SETUP_MINUTES: "defaultSetupMinutes",
	DEFAULT_CLEANUP_MINUTES: "defaultCleanupMinutes",
	DEFAULT_YIELD_RATE: "defaultYieldRate",
	MINIMUM_OPERATOR_COUNT: "minimumOperatorCount",
	MINIMUM_BATCH_QUANTITY: "minimumBatchQuantity",
	MINIMUM_BATCH_UNIT_ID: "minimumBatchUnitId",
	SOP_TEXT: "sopText",
	STATUS: "status",
} as const;

/** 列表 URL 查询参数契约（默认带 page, pageSize, keyword） */
export const operationSearchParams = defineListSearchParams({
	categoryId: "",
	status: "",
});
export type OperationSearchParams = Awaited<
	ReturnType<typeof operationSearchParams.parse>
>;

/** 工艺档案受控字段元数据定义（用于导出与字段权限） */
export const operationConfigurableFields = [
	{ field: OperationField.CODE, label: "工序编码", sensitive: false },
	{ field: OperationField.NAME, label: "工序名称", sensitive: false },
	{
		field: OperationField.OPERATION_CATEGORY_DICT_ITEM_ID,
		label: "工序分类",
		sensitive: false,
	},
	{
		field: OperationField.DEFAULT_SETUP_MINUTES,
		label: "准备时间(分钟)",
		sensitive: false,
	},
	{
		field: OperationField.DEFAULT_CLEANUP_MINUTES,
		label: "清理时间(分钟)",
		sensitive: false,
	},
	{
		field: OperationField.DEFAULT_YIELD_RATE,
		label: "参考出成率",
		sensitive: false,
	},
	{
		field: OperationField.MINIMUM_OPERATOR_COUNT,
		label: "最少操作人数",
		sensitive: false,
	},
	{
		field: OperationField.MINIMUM_BATCH_QUANTITY,
		label: "最小批量",
		sensitive: false,
	},
	{ field: OperationField.SOP_TEXT, label: "SOP操作说明", sensitive: false },
	{ field: OperationField.STATUS, label: "状态", sensitive: false },
] as const;

export const processPageContract: FeaturePagePermissionDescriptor = {
	resource: OperationResource,
	subject: OperationSubject,
	label: "工序与加工规格",
	path: "/production/operations",
	actions: [
		{ action: StandardAction.READ, label: "查看工序" },
		{ action: StandardAction.CREATE, label: "新建工序" },
		{ action: StandardAction.UPDATE, label: "修改工序" },
		{ action: StandardAction.DELETE, label: "删除工序" },
		{ action: ProcessAction.TOGGLE_STATUS, label: "启停用工序" },
	],
	configurableFields: operationConfigurableFields.map((f) => ({
		field: f.field,
		label: f.label,
		sensitive: f.sensitive,
	})),
};
