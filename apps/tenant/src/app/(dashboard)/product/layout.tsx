import React from "react";
import { ProductCenterAbilityBoundary } from "@domain/product-center/shared";
import { ProductSubject } from "@domain/product-center/product-management";
import { getTenantSubjectPermissions } from "@/kernel";

export default async function ProductLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const productPerms = await getTenantSubjectPermissions(ProductSubject);

	return (
		<ProductCenterAbilityBoundary
			permissions={{
				product: productPerms,
			}}
		>
			{children}
		</ProductCenterAbilityBoundary>
	);
}
