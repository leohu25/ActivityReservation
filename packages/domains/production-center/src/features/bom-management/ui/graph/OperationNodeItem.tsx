import { cn } from "@base/ui";
import type { GraphOperationNode } from "./types";

export interface OperationNodeItemProps {
	readonly op: GraphOperationNode;
	readonly left: number;
	readonly centerY: number;
}

/**
 * 加工工序节点组件：45度经典菱形卡片，展示工序名称、质检控制点与标准工时
 */
export function OperationNodeItem({
	op,
	left,
	centerY,
}: OperationNodeItemProps) {
	const diamSize = 70;

	return (
		<div
			className="absolute flex flex-col items-center justify-center group"
			style={{
				left: `${left}px`,
				top: `${centerY - diamSize / 2}px`,
				width: `${diamSize + 30}px`,
				height: `${diamSize}px`,
			}}
		>
			{/* 旋转 45 度的菱形框 */}
			<div
				className={cn(
					"absolute w-[68px] h-[68px] border-[1.8px] bg-white dark:bg-slate-900 rotate-45 rounded shadow-sm transition-transform group-hover:scale-105",
					op.isCheckpoint
						? "border-amber-500 bg-amber-50/30 dark:bg-amber-950/20"
						: "border-emerald-500 group-hover:bg-emerald-50/40",
				)}
			/>

			{/* 菱形中央文本 */}
			<div className="relative z-10 text-center px-1 flex flex-col items-center">
				<div className="text-xs font-bold text-emerald-800 dark:text-emerald-200 leading-tight">
					{op.name}
				</div>
				<div
					className={cn(
						"text-[10px] font-mono mt-1",
						op.isCheckpoint
							? "text-amber-600 font-semibold"
							: "text-emerald-600 dark:text-emerald-400",
					)}
				>
					{op.yieldRate}
				</div>
			</div>

			{/* 下方悬挂工时 */}
			{op.laborHours && (
				<div className="absolute -bottom-6 text-[10px] font-mono text-muted-foreground">
					{op.laborHours}
				</div>
			)}
		</div>
	);
}
