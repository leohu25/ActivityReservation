import { GitBranch } from "lucide-react";
import {
	Select,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectItem,
} from "@base/ui";
import type { BomVersionSummaryDto } from "../../types";

export interface VersionSwitcherBarProps {
	readonly currentVersionNumber: number;
	readonly description?: string | null;
	readonly versionHistory: readonly BomVersionSummaryDto[];
	readonly onSelectVersion?: (versionNumber: number) => void;
}

/**
 * 版本切换栏积木：展示当前版本序号、切换版本下拉框与版本说明
 */
export function VersionSwitcherBar({
	currentVersionNumber,
	description,
	versionHistory,
	onSelectVersion,
}: VersionSwitcherBarProps) {
	return (
		<div className="flex items-center gap-2 font-medium">
			<GitBranch className="size-3.5 text-muted-foreground shrink-0" />
			<span className="text-muted-foreground whitespace-nowrap">当前版本:</span>
			<Select
				value={String(currentVersionNumber)}
				onValueChange={(val) => onSelectVersion?.(Number(val))}
			>
				<SelectTrigger className="h-7 w-28 text-xs font-mono">
					<SelectValue placeholder={`版本 ${currentVersionNumber}`} />
				</SelectTrigger>
				<SelectContent>
					{versionHistory.map((v) => (
						<SelectItem key={v.id} value={String(v.versionNumber)}>
							版本 {v.versionNumber} (
							{v.versionStatus === "PUBLISHED" ? "已发布" : "草稿"})
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			{description && (
				<span className="text-xs text-muted-foreground truncate max-w-sm ml-2 hidden sm:inline">
					{description}
				</span>
			)}
		</div>
	);
}
