"use client";

import React from "react";
import {
	TenantAbilityProvider,
	createAbilityFromSnapshot,
	type AbilitySnapshot,
} from "@base/authorization";
import { UiAbilityProvider } from "@base/ui";
import { SupplierSubject } from "../../features/supplier-management/contract";

export interface SupplierCenterAbilityPermissions {
	readonly supplier: {
		readonly actions: readonly string[];
		readonly fieldPolicies?: Readonly<Record<string, string>>;
	};
}

export function buildSupplierCenterAbilitySnapshots(
	permissions: SupplierCenterAbilityPermissions,
): AbilitySnapshot[] {
	return [
		{
			subject: SupplierSubject,
			actions: permissions.supplier.actions,
			fieldPolicies: permissions.supplier.fieldPolicies,
		},
	];
}

export function SupplierCenterAbilityBoundary({
	permissions,
	children,
}: {
	readonly permissions: SupplierCenterAbilityPermissions;
	readonly children: React.ReactNode;
}) {
	const snapshots = React.useMemo(
		() => buildSupplierCenterAbilitySnapshots(permissions),
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
