import React from "react";
import { TenantsView } from "@base/feature-control-admin/tenant-management";
import { listTenantsPagedQuery } from "@base/feature-control-admin/tenant-management/server";

export const dynamic = "force-dynamic";

interface TenantsRouteProps {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    keyword?: string;
    status?: string;
  }>;
}

/**
 * 控制平面 - 租户运维中心页面 (极薄装配挂载点，正统 Server-Driven 模式)
 */
export default async function TenantsRoute({
  searchParams,
}: TenantsRouteProps): Promise<React.JSX.Element> {
  const params = await searchParams;
  const pagedResult = await listTenantsPagedQuery({
    page: Number(params.page) || 1,
    pageSize: Number(params.pageSize) || 10,
    keyword: params.keyword,
    status: params.status,
  });

  return <TenantsView data={pagedResult.data} total={pagedResult.total} />;
}
