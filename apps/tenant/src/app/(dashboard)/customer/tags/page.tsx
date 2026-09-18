import {
	TagView,
	customerTagSearchParams,
} from "@base/feature-customer-center/customer-management/tag";
import { listTagsQuery } from "@base/feature-customer-center/customer-management/tag/server";

interface PageProps {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * 业务标签页：标准 Next.js App Router Server Component。
 * 契约解析 URL -> 并发取数 -> 渲染视图。
 */
export default async function TagsPage({ searchParams }: PageProps) {
	const parsed = await customerTagSearchParams.parse(searchParams);

	const tagsPage = await listTagsQuery({
		page: parsed.page,
		pageSize: parsed.pageSize,
		keyword: String(parsed.keyword ?? "") || undefined,
		tagType: String(parsed.tagType ?? "") || undefined,
		status: (String(parsed.status ?? "") || undefined) as never,
	});

	return <TagView data={tagsPage.items} total={tagsPage.total} />;
}
