import { CustomerSubject } from "@base/feature-customer-center/customer-management";
import {
  CustomerCategorySubject,
  CustomerTagSubject,
} from "@base/feature-customer-center/customer-management/classification";
import { CustomerQuoteSubject } from "@base/feature-customer-center/quotation-management";
import { CustomerAbilityBoundary } from "@base/feature-customer-center/shared";
import { CustomerStoreSubject } from "@base/feature-customer-center/store-management";
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
