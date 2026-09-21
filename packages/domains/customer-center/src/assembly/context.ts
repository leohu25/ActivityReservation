import {
	createTenantSliceContext,
	type TenantSliceContext,
} from "@base/authorization/server";
import { customerCatalog } from "../catalog";
import type {
	CustomerActionType,
	CustomerSubjectType,
} from "../shared/contract-types";

export type TenantCustomerContext = TenantSliceContext<
	CustomerActionType,
	CustomerSubjectType
>;

/**
 * 业务区域装配层：组合租户 DB 上下文与 Customer Center 权限目录。
 * 依托基座高阶工厂 createTenantSliceContext，内置 React.cache() 记忆化。
 */
export const {
	getContext: getTenantCustomerContext,
	assertAbility: assertCustomerAbility,
} = createTenantSliceContext<CustomerActionType, CustomerSubjectType>(
	customerCatalog,
);
