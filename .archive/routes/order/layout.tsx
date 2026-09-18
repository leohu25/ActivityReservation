import { SalesOrderSubject } from "@base/feature-order-center/sales-order";
import { OrderAbilityBoundary } from "@base/feature-order-center/shared";
import { getTenantSubjectPermissions } from "@/kernel";

/** Order Center Business Area 的统一 CASL Provider 装配边界 */
export default async function OrderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const salesOrder = await getTenantSubjectPermissions(SalesOrderSubject);

  return (
    <OrderAbilityBoundary permissions={{ salesOrder }}>
      {children}
    </OrderAbilityBoundary>
  );
}
