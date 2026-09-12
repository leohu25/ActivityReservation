import type { CustomerListItem } from "@chenrun/feature-customer-center/customer-management";
import { listCustomersQuery } from "@chenrun/feature-customer-center/customer-management/server";
import {
  QuoteView,
  type QuoteListItem,
} from "@chenrun/feature-customer-center/quotation-management";
import { listQuotesQuery } from "@chenrun/feature-customer-center/quotation-management/server";
import type { StoreListItem } from "@chenrun/feature-customer-center/store-management";
import { listStoresQuery } from "@chenrun/feature-customer-center/store-management/server";

type SearchParams = Record<string, string | string[] | undefined>;

function readOne(sp: SearchParams, key: string): string {
  const value = sp[key];
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function readInt(sp: SearchParams, key: string, fallback: number): number {
  const value = parseInt(readOne(sp, key), 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

/** 报价单页：路由只解析 URL 并装配 Feature Query 与 UI。 */
export default async function QuotesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const page = readInt(params, "page", 1);
  const pageSize = Math.min(100, readInt(params, "pageSize", 10));
  const status = readOne(params, "status");

  const [quotePage, customerPage, storePage] = await Promise.all([
    listQuotesQuery({ page, pageSize, status: status || undefined }),
    listCustomersQuery({ page: 1, pageSize: 100 }),
    listStoresQuery({ page: 1, pageSize: 100 }),
  ]);

  return (
    <QuoteView
      initialQuotes={quotePage.items as QuoteListItem[]}
      initialTotal={quotePage.total}
      initialPage={page}
      initialPageSize={pageSize}
      initialStatus={status}
      customers={customerPage.items as CustomerListItem[]}
      stores={storePage.items as StoreListItem[]}
    />
  );
}
