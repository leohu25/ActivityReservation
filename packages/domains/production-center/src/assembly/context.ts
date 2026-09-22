import {
	createTenantSliceContext,
	type TenantSliceContext,
} from "@base/authorization/server";
import { productionCenterCatalog } from "../catalog";
import type {
	ProductionCenterActionType,
	ProductionCenterSubjectType,
} from "../shared/contract-types";

export type TenantProductionCenterContext = TenantSliceContext<
	ProductionCenterActionType,
	ProductionCenterSubjectType
>;

export const {
	getContext: getTenantProductionCenterContext,
	assertAbility: assertProductionCenterAbility,
} = createTenantSliceContext<
	ProductionCenterActionType,
	ProductionCenterSubjectType
>(productionCenterCatalog);
