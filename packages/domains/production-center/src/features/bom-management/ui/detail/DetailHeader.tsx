import { Check } from "lucide-react";
import {
	SheetHeader,
	SheetTitle,
	SheetDescription,
	Badge,
	Button,
	ConfirmDialog,
	AuthGuard,
} from "@base/ui";
import { useAbility, StandardAction } from "@base/authorization";
import { BomSubject, BomAction, BomField } from "../../contract";
import type { BomDetailDto } from "../../types";

export interface DetailHeaderProps {
	readonly detail: BomDetailDto;
	readonly onEdit?: (detail: BomDetailDto) => void;
	readonly onPublishVersion?: (bomId: string, versionNumber: number) => void;
}

const BOM_TYPE_BADGES: Record<
	string,
	{ label: string; variant: "default" | "secondary" | "outline" }
> = {
	PROCESSING: { label: "单品加工", variant: "default" },
	FORMULA: { label: "组合配方", variant: "secondary" },
	PACKAGING: { label: "包装装配", variant: "outline" },
};

/**
 * 详情抽屉头部元信息积木：BOM 名称、默认状态、类型徽章、操作按钮与方案指标
 */
export function DetailHeader({
	detail,
	onEdit,
	onPublishVersion,
}: DetailHeaderProps) {
	const { currentVersion, primaryProduct, isDefault } = detail;
	const typeConfig = BOM_TYPE_BADGES[currentVersion.bomType] ?? {
		label: currentVersion.bomType,
		variant: "secondary",
	};
	const byProducts = currentVersion.outputs.filter(
		(o) => o.outputRole === "BYPRODUCT",
	);

	const ability = useAbility();
	const canReadTotalYield = ability.can(StandardAction.READ, BomSubject, BomField.TOTAL_YIELD_RATE);

	return (
		<SheetHeader className="pb-3 border-b">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<SheetTitle className="text-xl font-bold flex items-center gap-2">
						{primaryProduct.name}
						{isDefault && (
							<Badge
								variant="default"
								size="sm"
								className="bg-blue-600 hover:bg-blue-600"
							>
								默认BOM
							</Badge>
						)}
						<Badge variant={typeConfig.variant} size="sm">
							{typeConfig.label}
						</Badge>
					</SheetTitle>
				</div>
				<div className="flex items-center gap-2">
					{currentVersion.versionStatus === "DRAFT" && onPublishVersion && (
						<AuthGuard action={BomAction.PUBLISH} subject={BomSubject}>
							<ConfirmDialog
								trigger={
									<Button
										size="sm"
										className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
									>
										<Check className="size-3.5" /> 发布当前版本
									</Button>
								}
								title={`确认发布 ${primaryProduct.name} 版本 ${currentVersion.versionNumber}？`}
								description="发布后该版本将切换为生效标准，只影响后续未生成的生产计划，已生成的计划不受影响。"
								confirmText="确认发布"
								cancelText="取消"
								onConfirm={() =>
									onPublishVersion(detail.id, currentVersion.versionNumber)
								}
							/>
						</AuthGuard>
					)}
					{onEdit && (
						<AuthGuard action={StandardAction.UPDATE} subject={BomSubject}>
							<Button
								variant="outline"
								size="sm"
								onClick={() => onEdit(detail)}
								className="gap-1.5"
							>
								编辑方案
							</Button>
						</AuthGuard>
					)}
				</div>
			</div>

			<SheetDescription className="flex flex-wrap items-center gap-x-6 gap-y-1.5 text-xs text-muted-foreground mt-2">
				<span>
					BOM 编码:{" "}
					<strong className="font-mono text-foreground">
						{currentVersion.code}
					</strong>
				</span>
				<span>
					方案名称:{" "}
					<strong className="text-foreground">
						{currentVersion.name}
					</strong>
				</span>
				<span>
					生产产线:{" "}
					<strong className="text-foreground">
						{currentVersion.productionLineName || "未指定"}
					</strong>
				</span>
				{canReadTotalYield && currentVersion.totalYieldEnabled && (
					<span>
						总出成率:{" "}
						<strong className="text-emerald-600 font-semibold font-mono">
							{Number(currentVersion.totalYieldRate || 1) * 100}%
						</strong>
					</span>
				)}
				{byProducts.length > 0 && (
					<span className="flex items-center gap-1.5">
						副产品:
						{byProducts.map((bp) => (
							<Badge
								key={bp.productId}
								variant="secondary"
								className="h-5 px-1.5 text-[11px] bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800"
							>
								{bp.productName || bp.productCode}
							</Badge>
						))}
					</span>
				)}
			</SheetDescription>
		</SheetHeader>
	);
}
