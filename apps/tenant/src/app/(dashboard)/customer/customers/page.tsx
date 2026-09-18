import {
	CustomerView,
	customerSearchParams,
	type CustomerListItem,
} from "@base/feature-customer-center/customer-management";
import {
	listCustomersQuery,
	getCustomerPageOptionsQuery,
} from "@base/feature-customer-center/customer-management/server";

interface PageProps {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * 客户档案页：标准 Next.js App Router Server Component。
 * 直观透明：契约解析 URL -> 并发取数 -> 渲染视图，零黑盒包裹。
 */
export default async function CustomersPage({ searchParams }: PageProps) {
	const parsed = await customerSearchParams.parse(searchParams);

	const [customerPage, pageOptions] = await Promise.all([
		listCustomersQuery({
			page: parsed.page,
			pageSize: parsed.pageSize,
			keyword: String(parsed.keyword ?? "") || undefined,
			categoryCode: String(parsed.category ?? "") || undefined,
			status: String(parsed.status ?? "") || undefined,
		}),
		getCustomerPageOptionsQuery(),
	]);

	return (
		<CustomerView
			data={customerPage.items as CustomerListItem[]}
			total={customerPage.total}
			categoryOptions={pageOptions.categoryOptions}
			tagOptions={pageOptions.tagOptions}
		/>
	);
}
