import type { StandardAction } from "@base/authorization";
import type {
	SupplierSubject,
	SupplierProductSubject,
	SupplierAction,
} from "../features/supplier-management/contract";

export type SupplierCenterSubjectType =
	| SupplierSubject
	| SupplierProductSubject;

export type SupplierCenterActionType =
	| StandardAction
	| (typeof SupplierAction)[keyof typeof SupplierAction];
