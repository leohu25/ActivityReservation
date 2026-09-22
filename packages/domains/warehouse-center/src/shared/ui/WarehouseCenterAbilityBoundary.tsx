"use client";

import React from "react";
import {
	TenantAbilityProvider,
	createAbilityFromSnapshot,
	type AbilitySnapshot,
} from "@base/authorization";
import { UiAbilityProvider } from "@base/ui";
import { WarehouseSubject } from "../../features/warehouse-management/contract";

export interface WarehouseCenterAbilityPermissions {
	readonly warehouse: {
		readonly actions: readonly string[];
		readonly fieldPolicies?: Readonly<Record<string, string>>;
	};
}

export function buildWarehouseCenterAbilitySnapshots(
	permissions: WarehouseCenterAbilityPermissions,
): AbilitySnapshot[] {
	return [
		{
			subject: WarehouseSubject,
			actions: permissions.warehouse.actions,
			fieldPolicies: permissions.warehouse.fieldPolicies,
		},
	];
}

export function WarehouseCenterAbilityBoundary({
	permissions,
	children,
}: {
	readonly permissions: WarehouseCenterAbilityPermissions;
	readonly children: React.ReactNode;
}) {
	const snapshots = React.useMemo(
		() => buildWarehouseCenterAbilitySnapshots(permissions),
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
