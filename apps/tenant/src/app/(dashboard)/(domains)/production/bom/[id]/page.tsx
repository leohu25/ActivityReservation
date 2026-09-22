import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BomFormPage } from "@domain/production-center/bom-management";
import {
	getBomDetailQuery,
	getBomFormOptionsQuery,
} from "@domain/production-center/bom-management/server";

interface BomDetailPageProps {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ mode?: string; version?: string }>;
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ id: string }>;
}): Promise<Metadata> {
	const { id } = await params;
	const detail = await getBomDetailQuery(id);
	return {
		title: detail?.currentVersion?.name
			? `生产BOM: ${detail.currentVersion.name}`
			: "生产BOM详情",
	};
}

/**
 * 生产 BOM 详情与编辑页面 (全屏单据工作台 FormPage)
 * - 支持 edit 与 view 双模态切换
 * - 独立路由在 TabBar 中自动开启独立页签
 */
export default async function BomDetailPage({
	params,
	searchParams,
}: BomDetailPageProps) {
	const [{ id }, query] = await Promise.all([params, searchParams]);

	const targetVersion = query.version ? Number(query.version) : undefined;
	const [detail, formOptions] = await Promise.all([
		getBomDetailQuery(id, targetVersion),
		getBomFormOptionsQuery(),
	]);

	if (!detail) {
		notFound();
	}

	const mode = query.mode === "view" ? "view" : "edit";

	return (
		<BomFormPage
			mode={mode}
			bomId={id}
			initialDetail={detail}
			formOptions={formOptions}
			backUrl="/production/bom"
		/>
	);
}
