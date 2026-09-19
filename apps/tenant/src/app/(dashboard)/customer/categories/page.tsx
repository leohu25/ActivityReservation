import {
	CategoryView,
	customerCategorySearchParams,
} from "@domain/customer-center/customer-management/category";
import {
	listCategoriesQuery,
	getCustomerCategoryOptionsQuery,
} from "@domain/customer-center/customer-management/category/server";

interface PageProps {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * 客户分类页：标准 Next.js App Router Server Component。
 * 契约解析 URL -> 并发取数 -> 渲染视图。
 */
export default async function CategoriesPage({ searchParams }: PageProps) {
	const parsed = await customerCategorySearchParams.parse(searchParams);

	const [categoriesPage, categoryOptions] = await Promise.all([
		listCategoriesQuery({
			page: parsed.page,
			pageSize: parsed.pageSize,
			keyword: String(parsed.keyword ?? "") || undefined,
			status: (String(parsed.status ?? "") || undefined) as never,
		}),
		getCustomerCategoryOptionsQuery(),
	]);

	return (
		<CategoryView
			data={categoriesPage.items}
			total={categoriesPage.total}
			categoryOptions={categoryOptions}
		/>
	);
}
