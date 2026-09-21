import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
	StoreFormPage,
	type StoreListItem,
} from "@domain/customer-center/store-management";
import {
	getStoreQuery,
	getStorePageOptionsQuery,
} from "@domain/customer-center/store-management/server";
import type { CustomerListItem } from "@domain/customer-center/customer-management";

interface StoreDetailPageProps {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ mode?: string }>;
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ id: string }>;
}): Promise<Metadata> {
	const { id } = await params;
	const store = await getStoreQuery(id);
	return {
		title: store?.name ? `门店: ${store.name}` : "门店档案详情",
	};
}

/**
 * 门店档案详情与编辑页（全屏单据工作台）
 * - 根据路由唯一 ID 提取完整门店数据，支持 edit 与 view 双态
 * - 在 TabBar 自动挂载独立页签，单据修改与提交后平滑保存在当前页
 */
export default async function StoreDetailPage({
	params,
	searchParams,
}: StoreDetailPageProps) {
	const [{ id }, query] = await Promise.all([params, searchParams]);

	const [store, pageOptions] = await Promise.all([
		getStoreQuery(id),
		getStorePageOptionsQuery(),
	]);

	if (!store) {
		notFound();
	}

	const mode = query.mode === "view" ? "view" : "edit";

	// SAFETY: store 经 pickReadableFields 授权过滤，结构与 StoreListItem 兼容
	const safeRecord = store as unknown as StoreListItem;
	// SAFETY: pageOptions.customerOptions 字段与 CustomerListItem 兼容
	const customers = pageOptions.customerOptions as unknown as CustomerListItem[];

	return (
		<StoreFormPage
			mode={mode}
			record={safeRecord}
			customers={customers}
			backUrl="/customer/stores"
		/>
	);
}
