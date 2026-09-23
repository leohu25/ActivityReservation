import React from "react";
import { bomSearchParams } from "@domain/production-center/bom-management";
import {
  listBomsQuery,
  getBomFormOptionsQuery,
} from "@domain/production-center/bom-management/server";
import { BomListView } from "@domain/production-center/bom-management";

interface BomPageProps {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ProductionBomPage({
  searchParams,
}: BomPageProps) {
  const parsed = await bomSearchParams.parse(searchParams);

  const [bomResult, formOptions] = await Promise.all([
    listBomsQuery({
      page: parsed.page,
      pageSize: parsed.pageSize,
      keyword: String(parsed.keyword ?? "") || undefined,
      bomType: String(parsed.bomType ?? "") || undefined,
      categoryId: String(parsed.categoryId ?? "") || undefined,
      status: String(parsed.status ?? "") || undefined,
    }),
    getBomFormOptionsQuery(),
  ]);

  return (
    <BomListView
      data={bomResult.items}
      total={bomResult.total}
      formOptions={formOptions}
    />
  );
}
