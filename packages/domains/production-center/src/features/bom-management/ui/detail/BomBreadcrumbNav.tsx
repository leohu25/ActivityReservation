import { ChevronLeft, ChevronRight, Layers } from "lucide-react";
import { Badge, Button } from "@base/ui";

export interface BomBreadcrumbNode {
	readonly id: string;
	readonly name: string;
	readonly versionText: string;
	readonly isRoot?: boolean;
}

export interface BomBreadcrumbNavProps {
	readonly stack: readonly BomBreadcrumbNode[];
	readonly onBack: () => void;
	readonly onSelectNode: (index: number) => void;
}

/**
 * 多层级嵌套 BOM 穿透路径面包屑导航条：
 * 专为工业复杂多级配方/BOM设计，支持多层级无限下钻、跨级任意跳转、一键快捷返回上一级与当前深度显式指示
 */
export function BomBreadcrumbNav({
	stack,
	onBack,
	onSelectNode,
}: BomBreadcrumbNavProps) {
	// 仅在存在下钻穿透（深度 >= 2）时展示，单层保持中立清爽
	if (stack.length <= 1) return null;

	const currentIndex = stack.length - 1;

	return (
		<div className="rounded-lg border border-cyan-200 dark:border-cyan-800 bg-cyan-50/50 dark:bg-cyan-950/30 px-3 py-1.5 mb-3 flex items-center justify-between gap-3 text-xs animate-in fade-in slide-in-from-top-1 duration-200 select-none">
			{/* 左侧：返回上级按钮与层级面包屑路径 */}
			<div className="flex items-center gap-2 overflow-x-auto min-w-0 py-0.5">
				<Button
					type="button"
					variant="outline"
					size="xs"
					onClick={onBack}
					className="h-6 px-2 text-[11px] gap-1 border-cyan-300 dark:border-cyan-700 text-cyan-800 dark:text-cyan-200 hover:bg-cyan-100/70 dark:hover:bg-cyan-900/40 shrink-0 font-medium"
				>
					<ChevronLeft className="size-3" />
					返回上一级
				</Button>

				<div className="h-3.5 w-px bg-cyan-300/80 dark:bg-cyan-700/80 shrink-0 mx-0.5" />

				<div className="flex items-center gap-1.5 text-xs overflow-x-auto min-w-0">
					{stack.map((item, idx) => {
						const isLast = idx === currentIndex;
						return (
							<div
								key={`${item.id}-${idx}`}
								className="flex items-center gap-1.5 shrink-0"
							>
								{idx > 0 && (
									<ChevronRight className="size-3 text-cyan-400 dark:text-cyan-600 shrink-0" />
								)}

								{isLast ? (
									<span className="font-bold text-foreground flex items-center gap-1 bg-white/70 dark:bg-slate-900/70 px-1.5 py-0.5 rounded border border-cyan-200 dark:border-cyan-800 text-[11px]">
										<span>{item.name}</span>
										<span className="text-[10px] font-mono text-cyan-700 dark:text-cyan-300">
											({item.versionText})
										</span>
									</span>
								) : (
									<button
										type="button"
										onClick={() => onSelectNode(idx)}
										className="text-cyan-700 dark:text-cyan-300 hover:text-cyan-950 dark:hover:text-cyan-100 hover:underline flex items-center gap-1 text-[11px] font-medium transition-colors"
										title={`点击直接回跳至：${item.name} (${item.versionText})`}
									>
										{idx === 0 && (
											<Layers className="size-3 text-cyan-600 dark:text-cyan-400" />
										)}
										<span>{item.name}</span>
										<span className="text-[10px] font-mono text-cyan-600/70 dark:text-cyan-400/70">
											({item.versionText})
										</span>
									</button>
								)}
							</div>
						);
					})}
				</div>
			</div>

			{/* 右侧：当前穿透深度与层级指示 */}
			<div className="flex items-center gap-2 shrink-0">
				<Badge
					variant="secondary"
					className="h-5 px-1.5 text-[10px] font-mono bg-cyan-100 dark:bg-cyan-900/60 text-cyan-800 dark:text-cyan-200 border-cyan-300"
				>
					穿透深度: {stack.length} 层
				</Badge>
			</div>
		</div>
	);
}
