import {
	StandardAction,
	type FeaturePagePermissionDescriptor,
} from "@base/authorization";

export const OperationSubject = "Operation";
export type OperationSubject = typeof OperationSubject;

export const ProcessingSpecificationSubject = "ProcessingSpecification";
export type ProcessingSpecificationSubject = typeof ProcessingSpecificationSubject;

export const ProcessAction = {
	...StandardAction,
} as const;

export const processPageContract: FeaturePagePermissionDescriptor = {
	resource: "production_center.process",
	subject: OperationSubject,
	label: "工序与加工规格",
	path: "/production/operations",
	actions: [
		{ action: StandardAction.READ, label: "查看工序" },
		{ action: StandardAction.CREATE, label: "新建工序" },
		{ action: StandardAction.UPDATE, label: "修改工序" },
		{ action: StandardAction.DELETE, label: "删除工序" },
	],
};
