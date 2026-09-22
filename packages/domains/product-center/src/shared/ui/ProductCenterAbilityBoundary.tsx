"use client";

import React from "react";
import {
	TenantAbilityProvider,
	createAbilityFromSnapshot,
	type AbilitySnapshot,
} from "@base/authorization";
import { UiAbilityProvider } from "@base/ui";
import { ProductSubject } from "../../features/product-management/contract";

export interface ProductCenterAbilityPermissions {
	readonly product: {
		readonly actions: readonly string[];
		readonly fieldPolicies?: Readonly<Record<string, string>>;
	};
}

export function buildProductCenterAbilitySnapshots(
	permissions: ProductCenterAbilityPermissions,
): AbilitySnapshot[] {
	return [
		{
			subject: ProductSubject,
			actions: permissions.product.actions,
			fieldPolicies: permissions.product.fieldPolicies,
		},
	];
}

export function ProductCenterAbilityBoundary({
	permissions,
	children,
}: {
	readonly permissions: ProductCenterAbilityPermissions;
	readonly children: React.ReactNode;
}) {
	const snapshots = React.useMemo(
		() => buildProductCenterAbilitySnapshots(permissions),
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
