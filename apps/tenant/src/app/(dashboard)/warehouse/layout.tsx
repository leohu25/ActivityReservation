import React from "react";
import { WarehouseCenterAbilityBoundary } from "@domain/warehouse-center/shared";
import { WarehouseSubject } from "@domain/warehouse-center/warehouse-management";
import { getTenantSubjectPermissions } from "@/kernel";

export default async function WarehouseLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const warehousePerms = await getTenantSubjectPermissions(WarehouseSubject);

	return (
		<WarehouseCenterAbilityBoundary
			permissions={{
				warehouse: warehousePerms,
			}}
		>
			{children}
		</WarehouseCenterAbilityBoundary>
	);
}
