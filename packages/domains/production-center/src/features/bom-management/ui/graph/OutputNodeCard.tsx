import { cn, Badge } from "@base/ui";
import type { GraphOutputNode } from "./types";

export interface OutputNodeCardProps {
	readonly out: GraphOutputNode;
	readonly left: number;
	readonly top: number;
	readonly height: number;
}

/**
 * 产出商品卡片组件：支持主产品（严格单产出）与联副产品（多选产出）的差异化视觉呈现
 */
export function OutputNodeCard({
	out,
	left,
	top,
	height,
}: OutputNodeCardProps) {
	return (
		<div
			key={out.id}
			className={cn(
				"absolute w-[170px] rounded shadow-md overflow-hidden flex flex-col justify-between",
				out.isPrimary
					? "border-2 border-blue-500 bg-white dark:bg-slate-900"
					: "border border-amber-500 bg-amber-50/40 dark:bg-amber-950/20",
			)}
			style={{ left: `${left}px`, top: `${top}px`, height: `${height}px` }}
		>
			<div className="p-2 text-center flex-1 flex flex-col justify-center">
				<div className="flex items-center justify-center gap-1">
					{!out.isPrimary && (
						<Badge
							variant="outline"
							className="text-[10px] px-1 py-0.2 rounded bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 font-semibold leading-none border-amber-400"
						>
							副
						</Badge>
					)}
					<span
						className={cn(
							"text-xs font-bold truncate",
							out.isPrimary
								? "text-blue-900 dark:text-blue-100"
								: "text-amber-900 dark:text-amber-100",
						)}
					>
						{out.name}
					</span>
				</div>
				<div
					className={cn(
						"text-[11px] font-mono mt-0.5",
						out.isPrimary
							? "text-blue-700 dark:text-blue-300"
							: "text-amber-700 dark:text-amber-300",
					)}
				>
					{out.quantity}
				</div>
			</div>
			<div
				className={cn(
					"text-white text-[11px] py-1 text-center font-mono font-medium",
					out.isPrimary ? "bg-blue-600" : "bg-amber-600",
				)}
			>
				{out.isPrimary ? out.cost : "副产品"}
			</div>
		</div>
	);
}
