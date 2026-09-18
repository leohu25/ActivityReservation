"use client";

import React from "react";
import {
	TenantAbilityProvider,
	createAbilityFromSnapshot,
	type AbilitySnapshot,
} from "@base/authorization";
import { UiAbilityProvider } from "@base/ui";
import { CustomerSubject } from "../../features/customer-management/contract";
import { CustomerCategorySubject } from "../../features/customer-management/category/contract";
import { CustomerTagSubject } from "../../features/customer-management/tag/contract";
import { CustomerStoreSubject } from "../../features/store-management/contract";
import { CustomerQuoteSubject } from "../../features/quotation-management/contract";

/** 客户中心各 Subject 的 RSC 权限纯数据 */
export interface CustomerAbilityPermissions {
	readonly customer: {
		readonly actions: readonly string[];
		readonly fieldPolicies?: Readonly<Record<string, string>>;
	};
	readonly store: {
		readonly actions: readonly string[];
		readonly fieldPolicies?: Readonly<Record<string, string>>;
	};
	readonly quote: {
		readonly actions: readonly string[];
		readonly fieldPolicies?: Readonly<Record<string, string>>;
	};
	readonly category: {
		readonly actions: readonly string[];
		readonly fieldPolicies?: Readonly<Record<string, string>>;
	};
	readonly tag: {
		readonly actions: readonly string[];
		readonly fieldPolicies?: Readonly<Record<string, string>>;
	};
}

/** 将客户中心多 Subject 权限编译为官方 Ability 快照列表 */
export function buildCustomerAbilitySnapshots(
	permissions: CustomerAbilityPermissions,
): AbilitySnapshot[] {
	return [
		{
			subject: CustomerSubject,
			actions: permissions.customer.actions,
			fieldPolicies: permissions.customer.fieldPolicies,
		},
		{
			subject: CustomerStoreSubject,
			actions: permissions.store.actions,
			fieldPolicies: permissions.store.fieldPolicies,
		},
		{
			subject: CustomerQuoteSubject,
			actions: permissions.quote.actions,
			fieldPolicies: permissions.quote.fieldPolicies,
		},
		{
			subject: CustomerCategorySubject,
			actions: permissions.category.actions,
			fieldPolicies: permissions.category.fieldPolicies,
		},
		{
			subject: CustomerTagSubject,
			actions: permissions.tag.actions,
			fieldPolicies: permissions.tag.fieldPolicies,
		},
	];
}

/**
 * 客户中心官方 CASL 边界：layout 一次注入，子树统一 AbilityProvider。
 * 页面/View 禁止再传 ability/permissions，只声明 subject。
 */
export function CustomerAbilityBoundary({
	permissions,
	children,
}: {
	readonly permissions: CustomerAbilityPermissions;
	readonly children: React.ReactNode;
}) {
	const snapshots = React.useMemo(
		() => buildCustomerAbilitySnapshots(permissions),
		[permissions],
	);
	const ability = React.useMemo(
		() => createAbilityFromSnapshot(snapshots),
		[snapshots],
	);

	return (
		<TenantAbilityProvider snapshots={snapshots}>
			<UiAbilityProvider ability={ability}>{children}</UiAbilityProvider>
		</TenantAbilityProvider>
	);
}
