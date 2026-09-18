import type { CustomerListItem } from "@base/feature-customer-center/customer-management";
import { listCustomersQuery } from "@base/feature-customer-center/customer-management/server";
import {
	StoreView,
	type StoreListItem,
} from "@base/feature-customer-center/store-management";
import { listStoresQuery } from "@base/feature-customer-center/store-management/server";

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

/** 门店档案页：路由只解析 URL 并装配 Feature Query 与 UI。 */
export default async function StoresPage({
	searchParams,
}: {
	searchParams: Promise<SearchParams>;
}) {
	const params = await searchParams;
	const page = readInt(params, "page", 1);
	const pageSize = Math.min(100, readInt(params, "pageSize", 10));
	const keyword = readOne(params, "keyword");
	const customerId = readOne(params, "customer");
	const status = readOne(params, "status");

	const [storePage, customerPage] = await Promise.all([
		listStoresQuery({
			page,
			pageSize,
			keyword: keyword || undefined,
			customerId: customerId || undefined,
			status: status || undefined,
		}),
		listCustomersQuery({ page: 1, pageSize: 100 }),
	]);

	return (
		<StoreView
			initialStores={storePage.items as StoreListItem[]}
			initialTotal={storePage.total}
			initialPage={page}
			initialPageSize={pageSize}
			initialKeyword={keyword}
			initialCustomer={customerId}
			initialStatus={status}
			customers={customerPage.items as CustomerListItem[]}
		/>
	);
}
