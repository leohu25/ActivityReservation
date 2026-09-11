import {
  CustomerAbilityBoundary,
  CustomerCategorySubject,
  CustomerQuoteSubject,
  CustomerStoreSubject,
  CustomerSubject,
  CustomerTagSubject,
} from "@chenrun/feature-customer-center";
import { getTenantSubjectPermissions } from "@/kernel";

/**
 * 客户中心官方 CASL 布局边界：
 * 一次拉取本切片全部 Subject 权限快照，经 AbilityProvider 注入整棵子树。
 * 下级 page/View 只声明 subject，禁止再传 ability/permissions。
 */
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
      permissions={{
        customer,
        store,
        quote,
        category,
        tag,
      }}
    >
      {children}
    </CustomerAbilityBoundary>
  );
}
