import React from "react";
import { SupplierCenterAbilityBoundary } from "@domain/supplier-center/shared";
import { SupplierSubject } from "@domain/supplier-center/supplier-management";
import { getTenantSubjectPermissions } from "@/kernel";

export default async function SupplierLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const supplierPerms = await getTenantSubjectPermissions(SupplierSubject);

	return (
		<SupplierCenterAbilityBoundary
			permissions={{
				supplier: supplierPerms,
			}}
		>
			{children}
		</SupplierCenterAbilityBoundary>
	);
}
