import type { Metadata } from "next";
import { CustomerFormPage } from "@domain/customer-center/customer-management";
import { getCustomerPageOptionsQuery } from "@domain/customer-center/customer-management/server";

export const metadata: Metadata = {
	title: "新建客户档案",
};

/**
 * 新建客户档案页（全屏单据工作台）
 * - 取代传统居中模态窗，由 Next.js App Router 提供物理路由并在 TabBar 中自动开启独立页签
 * - 纯数据并发预取，遵循零 Promise 跨端透传规范
 */
export default async function NewCustomerPage() {
	const pageOptions = await getCustomerPageOptionsQuery();

	return (
		<CustomerFormPage
			mode="create"
			categoryOptions={pageOptions.categoryOptions}
			tagOptions={pageOptions.tagOptions}
			backUrl="/customer/customers"
		/>
	);
}
