"use client";

import React from "react";
import {
	TenantAbilityProvider,
	createAbilityFromSnapshot,
	type AbilitySnapshot,
} from "@base/authorization";
import { UiAbilityProvider } from "@base/ui";
import { BomSubject } from "../../features/bom-management/contract";
import { OperationSubject } from "../../features/process-management/contract";
import { ProductionLineSubject } from "../../features/production-resource-management/contract";

export interface ProductionCenterAbilityPermissions {
	readonly bom: {
		readonly actions: readonly string[];
		readonly fieldPolicies?: Readonly<Record<string, string>>;
	};
	readonly process?: {
		readonly actions: readonly string[];
		readonly fieldPolicies?: Readonly<Record<string, string>>;
	};
	readonly resource?: {
		readonly actions: readonly string[];
		readonly fieldPolicies?: Readonly<Record<string, string>>;
	};
}

export function buildProductionCenterAbilitySnapshots(
	permissions: ProductionCenterAbilityPermissions,
): AbilitySnapshot[] {
	const snapshots: AbilitySnapshot[] = [
		{
			subject: BomSubject,
			actions: permissions.bom.actions,
			fieldPolicies: permissions.bom.fieldPolicies,
		},
	];

	if (permissions.process) {
		snapshots.push({
			subject: OperationSubject,
			actions: permissions.process.actions,
			fieldPolicies: permissions.process.fieldPolicies,
		});
	}

	if (permissions.resource) {
		snapshots.push({
			subject: ProductionLineSubject,
			actions: permissions.resource.actions,
			fieldPolicies: permissions.resource.fieldPolicies,
		});
	}

	return snapshots;
}

export function ProductionCenterAbilityBoundary({
	permissions,
	children,
}: {
	readonly permissions: ProductionCenterAbilityPermissions;
	readonly children: React.ReactNode;
}) {
	const snapshots = React.useMemo(
		() => buildProductionCenterAbilitySnapshots(permissions),
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
