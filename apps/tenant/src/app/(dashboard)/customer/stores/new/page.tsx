import type { Metadata } from "next";
import { StoreFormPage } from "@domain/customer-center/store-management";
import { getStorePageOptionsQuery } from "@domain/customer-center/store-management/server";
import type { CustomerListItem } from "@domain/customer-center/customer-management";

export const metadata: Metadata = {
	title: "新建门店档案",
};

/**
 * 新建门店档案页（全屏单据工作台）
 * - 取代传统模态弹窗，由 Next.js App Router 物理路由驱动并在 TabBar 自动挂载独立页签
 */
export default async function NewStorePage() {
	const pageOptions = await getStorePageOptionsQuery();

	// SAFETY: pageOptions.customerOptions 字段与 CustomerListItem 兼容
	const customers = pageOptions.customerOptions as unknown as CustomerListItem[];

	return (
		<StoreFormPage
			mode="create"
			customers={customers}
			backUrl="/customer/stores"
		/>
	);
}
