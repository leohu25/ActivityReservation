import {
	StoreView,
	customerStoreSearchParams,
	type StoreListItem,
} from "@base/feature-customer-center/store-management";
import {
	listStoresQuery,
	getStorePageOptionsQuery,
} from "@base/feature-customer-center/store-management/server";

interface PageProps {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * 门店档案页：标准 Next.js App Router Server Component。
 * 契约解析 URL -> 并发取数 -> 渲染纯受控视图。
 */
export default async function StoresPage({ searchParams }: PageProps) {
	const parsed = await customerStoreSearchParams.parse(searchParams);

	const [storePage, pageOptions] = await Promise.all([
		listStoresQuery({
			page: parsed.page,
			pageSize: parsed.pageSize,
			keyword: String(parsed.keyword ?? "") || undefined,
			customerId: String(parsed.customerId ?? "") || undefined,
			status: String(parsed.status ?? "") || undefined,
		}),
		getStorePageOptionsQuery(),
	]);

	return (
		<StoreView
			data={storePage.items as StoreListItem[]}
			total={storePage.total}
			customerOptions={pageOptions.customerOptions}
		/>
	);
}
