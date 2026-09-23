import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { cn, Badge, Button } from "@base/ui";
import type { GraphInputNode } from "./types";

export interface InputNodeCardProps {
	readonly node: GraphInputNode;
	readonly isExpanded: boolean;
	readonly isLoading: boolean;
	readonly left: number;
	readonly top: number;
	readonly height: number;
	readonly onToggleSubBom: (nodeId: string, childBomId: string) => void;
}

/**
 * 投入原料/半成品卡片组件：支持普通原料展示与嵌套自制件展开交互
 */
export function InputNodeCard({
	node,
	isExpanded,
	isLoading,
	left,
	top,
	height,
	onToggleSubBom,
}: InputNodeCardProps) {
	return (
		<div
			className={cn(
				"absolute w-[180px] rounded-lg shadow-sm overflow-hidden flex flex-col justify-between transition-all hover:shadow-md",
				node.isSubBom
					? "border-2 border-cyan-500 bg-white dark:bg-slate-900 ring-2 ring-cyan-500/10"
					: "border border-amber-400 bg-white dark:bg-slate-900",
			)}
			style={{ left: `${left}px`, top: `${top}px`, height: `${height}px` }}
		>
			<div className="p-2 text-center flex-1 flex flex-col justify-center">
				{/* 嵌套子 BOM 状态徽章与展开控制按钮 */}
				{node.isSubBom ? (
					<div className="flex items-center justify-between mb-1">
						<Badge
							variant="secondary"
							className="h-4 px-1 text-[9px] bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 border-cyan-300"
						>
							嵌套子BOM
						</Badge>
						<Button
							type="button"
							variant="ghost"
							size="xs"
							onClick={() =>
								node.childBomId && onToggleSubBom(node.id, node.childBomId)
							}
							className="h-5 px-1 text-[10px] text-cyan-600 hover:text-cyan-800 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 font-bold"
						>
							{isLoading ? (
								<Loader2 className="size-2.5 animate-spin" />
							) : isExpanded ? (
								<>
									收起 <ChevronUp className="size-2.5" />
								</>
							) : (
								<>
									展开图谱 <ChevronDown className="size-2.5" />
								</>
							)}
						</Button>
					</div>
				) : null}

				<div className="text-xs font-bold text-amber-900 dark:text-amber-100 truncate">
					{node.name}
				</div>
				<div className="text-[11px] font-mono text-amber-700/90 dark:text-amber-300/90 mt-0.5">
					{node.quantity}
				</div>
			</div>
			<div
				className={cn(
					"text-white text-[11px] py-1 text-center font-mono font-medium",
					node.isSubBom
						? "bg-gradient-to-r from-cyan-600 to-blue-600"
						: "bg-gradient-to-r from-amber-500 to-amber-600",
				)}
			>
				{node.isSubBom ? "自制半成品投入" : node.cost}
			</div>
		</div>
	);
}
