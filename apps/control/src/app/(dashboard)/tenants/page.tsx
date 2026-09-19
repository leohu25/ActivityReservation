import React from "react";
import {
  TenantsView,
  tenantSearchParams,
} from "@base/feature-control-admin/tenant-management";
import { listTenantsPagedQuery } from "@base/feature-control-admin/tenant-management/server";

export const dynamic = "force-dynamic";

interface TenantsRouteProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * 控制平面 - 租户运维中心页面 (极薄装配挂载点，正统 Server-Driven 模式)
 */
export default async function TenantsRoute({
  searchParams,
}: TenantsRouteProps): Promise<React.JSX.Element> {
  const params = await tenantSearchParams.parse(searchParams);
  const pagedResult = await listTenantsPagedQuery({
    page: params.page,
    pageSize: params.pageSize,
    keyword: String(params.keyword ?? "") || undefined,
    status: String(params.status ?? "") || undefined,
  });

  return <TenantsView data={pagedResult.data} total={pagedResult.total} />;
}
