export const ProcessingSpecificationSubject = "ProcessingSpecification";
export type ProcessingSpecificationSubject =
	typeof ProcessingSpecificationSubject;

export const ProcessingSpecificationField = {
	OPERATION_ID: "operationId",
	CODE: "code",
	NAME: "name",
	DESCRIPTION: "description",
	DEFAULT_YIELD_RATE: "defaultYieldRate",
	STATUS: "status",
} as const;

export const processingSpecificationConfigurableFields = [
	{ field: ProcessingSpecificationField.CODE, label: "规格编码", sensitive: false },
	{ field: ProcessingSpecificationField.NAME, label: "规格名称", sensitive: false },
	{
		field: ProcessingSpecificationField.DEFAULT_YIELD_RATE,
		label: "参考出成率",
		sensitive: false,
	},
	{
		field: ProcessingSpecificationField.DESCRIPTION,
		label: "加工说明",
		sensitive: false,
	},
	{ field: ProcessingSpecificationField.STATUS, label: "状态", sensitive: false },
] as const;
