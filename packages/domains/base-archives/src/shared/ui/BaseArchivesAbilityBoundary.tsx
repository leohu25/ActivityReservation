"use client";

import React from "react";
import {
	TenantAbilityProvider,
	createAbilityFromSnapshot,
	type AbilitySnapshot,
} from "@base/authorization";
import { UiAbilityProvider } from "@base/ui";
import { TenantDictItemSubject } from "../../features/dict/contract";

/** 基础档案各 Subject 的 RSC 权限纯数据 */
export interface BaseArchivesAbilityPermissions {
	readonly dict: {
		readonly actions: readonly string[];
		readonly fieldPolicies?: Readonly<Record<string, string>>;
	};
}

/** 将基础档案 Subject 权限编译为官方 Ability 快照列表 */
export function buildBaseArchivesAbilitySnapshots(
	permissions: BaseArchivesAbilityPermissions,
): AbilitySnapshot[] {
	return [
		{
			subject: TenantDictItemSubject,
			actions: permissions.dict.actions,
			fieldPolicies: permissions.dict.fieldPolicies,
		},
	];
}

export function BaseArchivesAbilityBoundary({
	permissions,
	children,
}: {
	readonly permissions: BaseArchivesAbilityPermissions;
	readonly children: React.ReactNode;
}) {
	const snapshots = React.useMemo(
		() => buildBaseArchivesAbilitySnapshots(permissions),
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
