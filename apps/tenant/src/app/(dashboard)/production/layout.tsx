import React from "react";
import { ProductionCenterAbilityBoundary } from "@domain/production-center/shared";
import { BomSubject } from "@domain/production-center/bom-management";
import { getTenantSubjectPermissions } from "@/kernel";

export default async function ProductionLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const bomPerms = await getTenantSubjectPermissions(BomSubject);

	return (
		<ProductionCenterAbilityBoundary
			permissions={{
				bom: bomPerms,
			}}
		>
			{children}
		</ProductionCenterAbilityBoundary>
	);
}
