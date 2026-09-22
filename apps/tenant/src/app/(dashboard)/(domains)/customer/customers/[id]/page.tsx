import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
	CustomerFormPage,
	type CustomerListItem,
} from "@domain/customer-center/customer-management";
import {
	getCustomerDetailQuery,
	getCustomerPageOptionsQuery,
} from "@domain/customer-center/customer-management/server";

interface CustomerDetailPageProps {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ mode?: string }>;
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ id: string }>;
}): Promise<Metadata> {
	const { id } = await params;
	const customer = await getCustomerDetailQuery(id);
	return {
		title: customer?.name ? `客户: ${customer.name}` : "客户档案详情",
	};
}

/**
 * 客户档案详情与编辑页（全屏单据工作台）
 * - 根据路由唯一 ID 提取完整客户数据，支持 edit 与 view 双态
 * - 在 TabBar 自动挂载独立页签，单据修改与提交后平滑关闭并返回
 */
export default async function CustomerDetailPage({
	params,
	searchParams,
}: CustomerDetailPageProps) {
	const [{ id }, query] = await Promise.all([params, searchParams]);

	const [customer, pageOptions] = await Promise.all([
		getCustomerDetailQuery(id),
		getCustomerPageOptionsQuery(),
	]);

	if (!customer) {
		notFound();
	}

	const mode = query.mode === "view" ? "view" : "edit";

	// SAFETY: customer 来自 getCustomerDetailQuery 并经 pickReadableFields 授权裁剪，字段结构对齐 CustomerListItem 模型
	const safeRecord = customer as unknown as CustomerListItem;

	return (
		<CustomerFormPage
			mode={mode}
			record={safeRecord}
			categoryOptions={pageOptions.categoryOptions}
			tagOptions={pageOptions.tagOptions}
			backUrl="/customer/customers"
		/>
	);
}
