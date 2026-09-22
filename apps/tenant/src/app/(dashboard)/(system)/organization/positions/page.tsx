import {
  PositionView,
  positionSearchParams,
  type PositionItem,
} from "@platform/tenant-admin/org-management";
import { listPositionsPagedQuery } from "@platform/tenant-admin/org-management/server";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * 岗位字典管理页面 (标准 Next.js App Router Server Component - 极薄装配层)
 */
export default async function OrganizationPositionsPage({
  searchParams,
}: PageProps) {
  const parsed = await positionSearchParams.parse(searchParams);

  const result = await listPositionsPagedQuery({
    page: parsed.page,
    pageSize: parsed.pageSize,
    keyword: String(parsed.keyword ?? "") || undefined,
    status: String(parsed.status ?? "") || undefined,
  });

  return (
    <PositionView
      data={result.items as PositionItem[]}
      total={result.total}
    />
  );
}
