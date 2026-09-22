import type { Metadata } from "next";
import { BomFormPage } from "@domain/production-center/bom-management";
import { getBomFormOptionsQuery } from "@domain/production-center/bom-management/server";

export const metadata: Metadata = {
	title: "新建生产BOM",
};

/**
 * 新建生产 BOM 页面 (全屏单据工作台 FormPage)
 * - 遵循技能规范：复杂多字段多明细表业务实体采用独立路由与 TabBar 独立页签打开
 */
export default async function NewBomPage() {
	const formOptions = await getBomFormOptionsQuery();

	return (
		<BomFormPage
			mode="create"
			formOptions={formOptions}
			backUrl="/production/bom"
		/>
	);
}
