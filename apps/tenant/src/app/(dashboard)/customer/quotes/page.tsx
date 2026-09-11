import {
  QuoteView,
  listQuotesAction,
  listCustomersAction,
  listStoresAction,
} from "@chenrun/feature-customer-center";
import type {
  CustomerListItem,
  QuoteListItem,
  StoreListItem,
} from "@chenrun/feature-customer-center/types";
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

/** 报价单页：权限由 customer/layout 的 AbilityProvider 注入 */
export default async function QuotesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const page = readInt(sp, "page", 1);
  const pageSize = Math.min(100, readInt(sp, "pageSize", 10));
  const status = readOne(sp, "status");

  const [quotesRes, custRes, storesRes] = await Promise.all([
    listQuotesAction({
      page,
      pageSize,
      status: status || undefined,
    }),
    listCustomersAction({ page: 1, pageSize: 100 }),
    listStoresAction({ page: 1, pageSize: 100 }),
  ]);

  const quoteList =
    quotesRes.success && quotesRes.data
      ? toPlainData(quotesRes.data)
      : { items: [], total: 0, page: 1, pageSize };
  const quotes = (
    Array.isArray(quoteList) ? quoteList : (quoteList.items ?? [])
  ) as QuoteListItem[];
  const total = Array.isArray(quoteList)
    ? quoteList.length
    : (quoteList.total ?? 0);

  const custList =
    custRes.success && custRes.data ? toPlainData(custRes.data) : null;
  const customers = (Array.isArray(custList)
    ? custList
    : ((custList?.items as never[]) ?? [])) as CustomerListItem[];

  const storeList =
    storesRes.success && storesRes.data ? toPlainData(storesRes.data) : null;
  const stores = (Array.isArray(storeList)
    ? storeList
    : ((storeList?.items as never[]) ?? [])) as StoreListItem[];

  return (
    <QuoteView
      initialQuotes={quotes}
      initialTotal={total}
      initialPage={page}
      initialPageSize={pageSize}
      initialStatus={status}
      customers={customers}
      stores={stores}
    />
  );
}
