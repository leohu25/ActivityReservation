import { Layers, ExternalLink, Loader2 } from "lucide-react";
import { Badge, Button } from "@base/ui";
import type { BomDetailDto } from "../../types";

export interface SubGraphPanelProps {
	readonly subDetail: BomDetailDto | null;
	readonly isLoading: boolean;
	readonly fallbackName: string;
	readonly childBomId?: string | null;
	readonly top: number;
	readonly height: number;
	readonly onNavigateBom?: (bomId: string) => void;
}

/**
 * 嵌套子 BOM 展开专属流程面板：直观渲染子 BOM 的原料投入与工序链
 */
export function SubGraphPanel({
	subDetail,
	isLoading,
	fallbackName,
	childBomId,
	top,
	height,
	onNavigateBom,
}: SubGraphPanelProps) {
	return (
		<div
			className="absolute w-[500px] rounded-xl border-2 border-dashed border-cyan-400/80 bg-cyan-50/25 dark:bg-cyan-950/25 p-3 shadow-sm transition-all animate-in fade-in zoom-in-95 duration-200 flex flex-col justify-between"
			style={{
				left: "20px",
				top: `${top}px`,
				height: `${height}px`,
			}}
		>
			{/* 子方案信息栏 */}
			<div className="h-6.5 shrink-0 flex items-center justify-between border-b border-cyan-200/80 dark:border-cyan-800/60 pb-1.5 text-[11px]">
				<div className="flex items-center gap-1.5 font-bold text-cyan-900 dark:text-cyan-200 truncate">
					<Layers className="size-3.5 text-cyan-600" />
					<span>子方案: {subDetail?.currentVersion.name || fallbackName}</span>
					{subDetail && (
						<Badge
							variant="outline"
							className="h-4 text-[10px] px-1 font-mono text-cyan-700 dark:text-cyan-300"
						>
							V{subDetail.currentVersion.versionNumber}
						</Badge>
					)}
				</div>
				{childBomId && (
					<Button
						type="button"
						variant="ghost"
						size="xs"
						onClick={() => onNavigateBom?.(childBomId)}
						className="h-5 px-1.5 text-[10px] text-cyan-600 hover:text-cyan-800 dark:text-cyan-400 gap-0.5"
					>
						穿透查看 <ExternalLink className="size-2.5" />
					</Button>
				)}
			</div>

			{/* 子方案内容流 */}
			{isLoading ? (
				<div className="flex-1 flex items-center justify-center gap-2 text-xs text-cyan-700 dark:text-cyan-300">
					<Loader2 className="size-4 animate-spin text-cyan-600" />
					<span>正在实时加载子 BOM 图谱...</span>
				</div>
			) : subDetail ? (
				<div className="flex-1 min-h-0 flex items-center justify-between gap-3 pt-2 overflow-hidden">
					{/* 子级原料 */}
					<div className="flex flex-col gap-1 w-28 shrink-0">
						{subDetail.currentVersion.inputs.slice(0, 2).map((subInp, subIdx) => (
							<div
								key={subIdx}
								className="rounded border border-cyan-300 bg-white dark:bg-slate-900 px-2 py-1 text-[11px] shadow-xs"
								title={`${subInp.productName} (${subInp.quantity} ${subInp.unitName || ""})`}
							>
								<div className="font-semibold text-cyan-900 dark:text-cyan-100 truncate">
									{subInp.productName}
								</div>
								<div className="text-[10px] text-muted-foreground font-mono">
									{subInp.quantity} {subInp.unitName || ""}
								</div>
							</div>
						))}
						{subDetail.currentVersion.inputs.length > 2 && (
							<div className="text-[10px] text-cyan-700 dark:text-cyan-300 text-center font-mono">
								+{subDetail.currentVersion.inputs.length - 2} 项原料...
							</div>
						)}
					</div>

					{/* 箭头指向子工序 */}
					<div className="text-cyan-500 font-bold text-xs shrink-0 select-none">➔</div>

					{/* 子级工序流程 */}
					<div className="flex items-center gap-3 overflow-x-auto flex-1 justify-center py-1">
						{subDetail.currentVersion.operations.map((subOp, opIdx) => {
							const opName = subOp.operationName || "工序";
							return (
								<div
									key={opIdx}
									className="relative flex items-center justify-center shrink-0 w-[58px] h-[52px]"
									title={opName}
								>
									{/* 正方形旋转 45 度的工序菱形，外接对角线 51px，在 58x52 容器内绝不越界穿透 */}
									<div className="size-[36px] border-[1.5px] border-emerald-500 bg-white dark:bg-slate-900 rotate-45 rounded-xs shadow-xs" />
									<span className="absolute inset-0 z-10 flex flex-col items-center justify-center text-[10px] font-bold text-emerald-800 dark:text-emerald-200 px-1 text-center leading-tight">
										{opName.length > 3 ? (
											<>
												<span>{opName.slice(0, 2)}</span>
												<span>{opName.slice(2, 5)}</span>
											</>
										) : (
											<span>{opName}</span>
										)}
									</span>
								</div>
							);
						})}
					</div>
				</div>
			) : (
				<div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">
					未关联生效的子方案详情
				</div>
			)}
		</div>
	);
}
