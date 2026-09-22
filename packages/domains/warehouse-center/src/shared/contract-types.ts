import type { StandardAction } from "@base/authorization";
import type {
	WarehouseSubject,
	WarehouseLocationSubject,
	WarehouseAction,
} from "../features/warehouse-management/contract";

export type WarehouseCenterSubjectType =
	| WarehouseSubject
	| WarehouseLocationSubject;

export type WarehouseCenterActionType =
	| StandardAction
	| (typeof WarehouseAction)[keyof typeof WarehouseAction];
