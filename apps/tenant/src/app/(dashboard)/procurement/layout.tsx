import {
  ProcurementAbilityBoundary,
  ProcurementOrderSubject,
} from "@base/feature-procurement-center";
import { getTenantSubjectPermissions } from "@/kernel";

/**
 * 采购中心官方 CASL 布局边界：一次注入 PurchaseOrder 权限快照。
 */
export default async function ProcurementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const order = await getTenantSubjectPermissions(ProcurementOrderSubject);

  return (
    <ProcurementAbilityBoundary permissions={{ order }}>
      {children}
    </ProcurementAbilityBoundary>
  );
}
