import {
  CustomerView,
  listCustomersAction,
  getCategoryTreeAction,
  listTagsAction,
} from "@chenrun/feature-customer-center";
import type { CustomerListItem } from "@chenrun/feature-customer-center/types";
import { toPlainData } from "@chenrun/shared";

type SearchParams = Record<string, string | string[] | undefined>;

function readOne(sp: SearchParams, key: string): string {
  const v = sp[key];
  if (Array.isArray(v)) return v[0] ?? "";
  return v ?? "";
}

function readInt(sp: SearchParams, key: string, fallback: number): number {
  const n = parseInt(readOne(sp, key), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/**
 * 客户档案页：权限由 customer/layout 的 AbilityProvider 注入，本页只取业务数据。
 */
export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const page = readInt(sp, "page", 1);
  const pageSize = Math.min(100, readInt(sp, "pageSize", 10));
  const keyword = readOne(sp, "keyword");
  const categoryCode = readOne(sp, "category");
  const status = readOne(sp, "status");

  const [custRes, catRes, tagsRes] = await Promise.all([
    listCustomersAction({
      page,
      pageSize,
      keyword: keyword || undefined,
      categoryCode: categoryCode || undefined,
      status: status || undefined,
    }),
    getCategoryTreeAction(),
    listTagsAction(),
  ]);

  const list =
    custRes.success && custRes.data
      ? toPlainData(custRes.data)
      : { items: [], total: 0, page: 1, pageSize };

  const customers = (
    Array.isArray(list) ? list : (list.items ?? [])
  ) as CustomerListItem[];
  const total = Array.isArray(list) ? list.length : (list.total ?? 0);
  const categories =
    catRes.success && catRes.data ? toPlainData(catRes.data) : [];
  const tags = tagsRes.success && tagsRes.data ? toPlainData(tagsRes.data) : [];

  return (
    <CustomerView
      initialCustomers={customers}
      initialTotal={total}
      initialPage={page}
      initialPageSize={pageSize}
      initialKeyword={keyword}
      initialCategory={categoryCode}
      initialStatus={status}
      categories={categories}
      tags={tags}
    />
  );
}