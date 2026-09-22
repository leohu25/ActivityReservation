import type { StandardAction } from "@base/authorization";
import type {
	WorkshopSubject,
	ProductionLineSubject,
	ProductionResourceAction,
} from "../features/production-resource-management/contract";
import type {
	OperationSubject,
	ProcessingSpecificationSubject,
	ProcessAction,
} from "../features/process-management/contract";
import type {
	BomSubject,
	BomVersionSubject,
	ProductDefaultBomSubject,
	BomAction,
} from "../features/bom-management/contract";

export type ProductionCenterSubjectType =
	| WorkshopSubject
	| ProductionLineSubject
	| OperationSubject
	| ProcessingSpecificationSubject
	| BomSubject
	| BomVersionSubject
	| ProductDefaultBomSubject;

export type ProductionCenterActionType =
	| StandardAction
	| (typeof ProductionResourceAction)[keyof typeof ProductionResourceAction]
	| (typeof ProcessAction)[keyof typeof ProcessAction]
	| (typeof BomAction)[keyof typeof BomAction];
