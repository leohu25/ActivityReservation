import {
	createTenantSliceContext,
	type TenantSliceContext,
} from "@base/authorization/server";
import { warehouseCenterCatalog } from "../catalog";
import type {
	WarehouseCenterActionType,
	WarehouseCenterSubjectType,
} from "../shared/contract-types";

export type TenantWarehouseCenterContext = TenantSliceContext<
	WarehouseCenterActionType,
	WarehouseCenterSubjectType
>;

export const {
	getContext: getTenantWarehouseCenterContext,
	assertAbility: assertWarehouseCenterAbility,
} = createTenantSliceContext<
	WarehouseCenterActionType,
	WarehouseCenterSubjectType
>(warehouseCenterCatalog);
