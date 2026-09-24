import React from "react";
import { ProductionCenterAbilityBoundary } from "@domain/production-center/shared";
import { BomSubject } from "@domain/production-center/bom-management";
import { OperationSubject } from "@domain/production-center/process-management";
import { getTenantSubjectPermissions } from "@/kernel";

export default async function ProductionLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const [bomPerms, processPerms] = await Promise.all([
		getTenantSubjectPermissions(BomSubject),
		getTenantSubjectPermissions(OperationSubject),
	]);

	return (
		<ProductionCenterAbilityBoundary
			permissions={{
				bom: bomPerms,
				process: processPerms,
			}}
		>
			{children}
		</ProductionCenterAbilityBoundary>
	);
}
