import {
	createTenantSliceContext,
	type TenantSliceContext,
} from "@base/authorization/server";
import { supplierCenterCatalog } from "../catalog";
import type {
	SupplierCenterActionType,
	SupplierCenterSubjectType,
} from "../shared/contract-types";

export type TenantSupplierCenterContext = TenantSliceContext<
	SupplierCenterActionType,
	SupplierCenterSubjectType
>;

export const {
	getContext: getTenantSupplierCenterContext,
	assertAbility: assertSupplierCenterAbility,
} = createTenantSliceContext<
	SupplierCenterActionType,
	SupplierCenterSubjectType
>(supplierCenterCatalog);
