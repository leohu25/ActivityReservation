import { CustomerSubject } from "@domain/customer-center/customer-management";
import { CustomerCategorySubject } from "@domain/customer-center/customer-management/category";
import { CustomerTagSubject } from "@domain/customer-center/customer-management/tag";
import { CustomerQuoteSubject } from "@domain/customer-center/quotation-management";
import { CustomerAbilityBoundary } from "@domain/customer-center/shared";
import { CustomerStoreSubject } from "@domain/customer-center/store-management";
import { getTenantSubjectPermissions } from "@/kernel";

/** Customer Center Business Area 的统一 CASL Provider 装配边界。 */
export default async function CustomerLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const [customer, store, quote, category, tag] = await Promise.all([
		getTenantSubjectPermissions(CustomerSubject),
		getTenantSubjectPermissions(CustomerStoreSubject),
		getTenantSubjectPermissions(CustomerQuoteSubject),
		getTenantSubjectPermissions(CustomerCategorySubject),
		getTenantSubjectPermissions(CustomerTagSubject),
	]);

	return (
		<CustomerAbilityBoundary
			permissions={{ customer, store, quote, category, tag }}
		>
			{children}
		</CustomerAbilityBoundary>
	);
}
