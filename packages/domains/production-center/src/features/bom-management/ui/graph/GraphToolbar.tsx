import { Sparkles, Layers } from "lucide-react";
import { Button } from "@base/ui";

export interface GraphToolbarProps {
	readonly subBomCount: number;
	readonly allSubExpanded: boolean;
	readonly onToggleAllSubBoms: () => void;
}

/**
 * 图谱顶部工具栏：提供图例指示与一键展开/折叠子图谱功能
 */
export function GraphToolbar({
	subBomCount,
	allSubExpanded,
	onToggleAllSubBoms,
}: GraphToolbarProps) {
	return (
		<div className="flex flex-wrap items-center justify-between pb-3.5 mb-2 border-b border-slate-100 dark:border-slate-800 text-xs select-none">
			{/* 业务节点图例 */}
			<div className="flex flex-wrap items-center gap-4">
				<span className="font-semibold text-foreground flex items-center gap-1.5">
					<Sparkles className="size-3.5 text-blue-600" /> 图谱图例:
				</span>
				<span className="flex items-center gap-1.5 text-muted-foreground">
					<span className="size-2.5 rounded-sm bg-amber-500 inline-block" /> 投入原料/辅料
				</span>
				<span className="flex items-center gap-1.5 text-muted-foreground">
					<span className="size-2.5 rounded-sm bg-cyan-500 inline-block" /> 嵌套子BOM自制件
				</span>
				<span className="flex items-center gap-1.5 text-muted-foreground">
					<span className="size-2.5 rotate-45 border border-emerald-500 bg-emerald-100 dark:bg-emerald-950 inline-block" /> 加工工序节点
				</span>
				<span className="flex items-center gap-1.5 text-muted-foreground">
					<span className="size-2.5 rounded-sm bg-blue-600 inline-block" /> 主产品产出
				</span>
				<span className="flex items-center gap-1.5 text-muted-foreground">
					<span className="size-2.5 rounded-sm bg-amber-600 inline-block" /> 联副产品
				</span>
			</div>

			{/* 一键展开全部子图谱控制 */}
			{subBomCount > 0 && (
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={onToggleAllSubBoms}
					className="h-7 text-xs gap-1.5 border-cyan-300 dark:border-cyan-800 text-cyan-800 dark:text-cyan-200 hover:bg-cyan-50 dark:hover:bg-cyan-950/40"
				>
					<Layers className="size-3.5 text-cyan-600" />
					{allSubExpanded ? "一键收起全部子图谱" : `一键展开全部子图谱 (${subBomCount})`}
				</Button>
			)}
		</div>
	);
}
