import {
  StoreView,
  CustomerStoreSubject,
  listStoresAction,
  listCustomersAction,
} from "@chenrun/feature-customer-center";
import { toPlainData } from "@chenrun/shared";
import { getTenantSubjectPermissions } from "@/kernel";

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

export default async function StoresPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const page = readInt(sp, "page", 1);
  const pageSize = Math.min(100, readInt(sp, "pageSize", 10));
  const keyword = readOne(sp, "keyword");
  const customerCode = readOne(sp, "customer");
  const status = readOne(sp, "status");

  const [storesRes, custRes, permissions] = await Promise.all([
    listStoresAction({
      page,
      pageSize,
      keyword: keyword || undefined,
      customerCode: customerCode || undefined,
      status: status || undefined,
    }),
    listCustomersAction({ page: 1, pageSize: 100 }),
    getTenantSubjectPermissions(CustomerStoreSubject),
  ]);

  const storeList =
    storesRes.success && storesRes.data
      ? toPlainData(storesRes.data)
      : { items: [], total: 0, page: 1, pageSize };
  const stores = Array.isArray(storeList)
    ? storeList
    : (storeList.items ?? []);
  const total = Array.isArray(storeList)
    ? storeList.length
    : (storeList.total ?? 0);

  const custList =
    custRes.success && custRes.data ? toPlainData(custRes.data) : null;
  const customers = Array.isArray(custList)
    ? custList
    : ((custList?.items as never[]) ?? []);

  return (
    <StoreView
      initialStores={stores}
      initialTotal={total}
      initialPage={page}
      initialPageSize={pageSize}
      initialKeyword={keyword}
      initialCustomer={customerCode}
      initialStatus={status}
      customers={customers}
      permissions={permissions}
    />
  );
}
