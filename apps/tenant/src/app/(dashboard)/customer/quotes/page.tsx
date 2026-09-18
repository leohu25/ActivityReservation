import {
	QuoteView,
	customerQuoteSearchParams,
	type QuoteListItem,
} from "@base/feature-customer-center/quotation-management";
import {
	listQuotesQuery,
	getQuotePageOptionsQuery,
} from "@base/feature-customer-center/quotation-management/server";

interface PageProps {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * 门店报价单页：标准 Next.js App Router Server Component。
 * 契约解析 URL -> 并发取数 -> 渲染受控视图。
 */
export default async function QuotesPage({ searchParams }: PageProps) {
	const parsed = await customerQuoteSearchParams.parse(searchParams);

	const [quotePage, pageOptions] = await Promise.all([
		listQuotesQuery({
			page: parsed.page,
			pageSize: parsed.pageSize,
			status: String(parsed.status ?? "") || undefined,
		}),
		getQuotePageOptionsQuery(),
	]);

	return (
		<QuoteView
			data={quotePage.items as QuoteListItem[]}
			total={quotePage.total}
			customerOptions={pageOptions.customerOptions}
			storeOptions={pageOptions.storeOptions}
		/>
	);
}
