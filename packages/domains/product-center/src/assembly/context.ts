import {
	createTenantSliceContext,
	type TenantSliceContext,
} from "@base/authorization/server";
import { productCenterCatalog } from "../catalog";
import type {
	ProductCenterActionType,
	ProductCenterSubjectType,
} from "../shared/contract-types";

export type TenantProductCenterContext = TenantSliceContext<
	ProductCenterActionType,
	ProductCenterSubjectType
>;

export const {
	getContext: getTenantProductCenterContext,
	assertAbility: assertProductCenterAbility,
} = createTenantSliceContext<
	ProductCenterActionType,
	ProductCenterSubjectType
>(productCenterCatalog);
