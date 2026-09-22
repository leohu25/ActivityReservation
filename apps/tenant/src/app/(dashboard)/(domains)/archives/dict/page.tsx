import {
	TenantDictItemView,
	dictItemSearchParams,
} from "@domain/base-archives/dict";
import { listTenantDictItemsQuery } from "@domain/base-archives/dict/server";

interface PageProps {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * 基础设置 - 数据字典管理页：标准 Next.js App Router Server Component。
 * 契约驱动解析 URL -> 并发取数 -> 注入视图。
 */
export default async function DictPage({ searchParams }: PageProps) {
	const parsed = await dictItemSearchParams.parse(searchParams);

	const dictPage = await listTenantDictItemsQuery({
		page: parsed.page,
		pageSize: parsed.pageSize,
		keyword: String(parsed.keyword ?? "") || undefined,
		type: String(parsed.type ?? "") || undefined,
		status: (String(parsed.status ?? "") || undefined) as never,
	});

	return <TenantDictItemView data={dictPage.items} total={dictPage.total} />;
}
