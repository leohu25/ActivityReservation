import type { StandardAction } from "@base/authorization";
import type {
	ProductSubject,
	ProductCategorySubject,
	UnitOfMeasureSubject,
	ProductAction,
} from "../features/product-management/contract";

export type ProductCenterSubjectType =
	| ProductSubject
	| ProductCategorySubject
	| UnitOfMeasureSubject;

export type ProductCenterActionType =
	| StandardAction
	| (typeof ProductAction)[keyof typeof ProductAction];
