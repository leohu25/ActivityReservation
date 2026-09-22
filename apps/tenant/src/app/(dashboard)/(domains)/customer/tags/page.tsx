import {
	TagView,
	customerTagSearchParams,
} from "@domain/customer-center/customer-management/tag";
import { listTagsQuery } from "@domain/customer-center/customer-management/tag/server";
import { DICT_TYPES } from "@domain/base-archives/dict";
import { getDictOptionsByTypeQuery } from "@domain/base-archives/dict/server";

interface PageProps {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * 业务标签页：标准 Next.js App Router Server Component。
 * 契约解析 URL -> 注入基础档案业务标签标识并并发取数 -> 渲染视图。
 */
export default async function TagsPage({ searchParams }: PageProps) {
	const parsed = await customerTagSearchParams.parse(searchParams);

	// 业务标签业务类型标识（从基础档案通用字典分类注入，对应 CUSTOMER_TAG_TYPE 场景）
	const tagTypeIdentifier = DICT_TYPES.CUSTOMER_TAG_TYPE;

	// 并发取数：标签列表数据（内置 tagType 关联对象 DTO 投影） + 过滤出基础设置中属于该业务标签标识的 ACTIVE 字典项枚举供前端筛选
	const [tagsPage, tagTypeOptions] = await Promise.all([
		listTagsQuery({
			page: parsed.page,
			pageSize: parsed.pageSize,
			keyword: String(parsed.keyword ?? "") || undefined,
			tagTypeId: String(parsed.tagTypeId ?? "") || undefined,
			status: (String(parsed.status ?? "") || undefined) as never,
		}),
		getDictOptionsByTypeQuery(tagTypeIdentifier),
	]);

	return (
		<TagView
			data={tagsPage.items}
			total={tagsPage.total}
			tagTypeOptions={tagTypeOptions}
		/>
	);
}
