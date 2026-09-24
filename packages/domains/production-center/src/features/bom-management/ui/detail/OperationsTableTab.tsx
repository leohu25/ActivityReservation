import {
	Table,
	TableHeader,
	TableBody,
	TableHead,
	TableRow,
	TableCell,
	Badge,
} from "@base/ui";
import type { BomOperationItemDto } from "../../types";

export interface OperationsTableTabProps {
	readonly operations: readonly BomOperationItemDto[];
}

/**
 * 详情抽屉：工艺路线工序明细表格选项卡积木
 */
export function OperationsTableTab({ operations }: OperationsTableTabProps) {
	return (
		<div className="rounded-lg border overflow-hidden">
			<Table className="w-full text-xs">
				<TableHeader className="bg-muted/50 border-b">
					<TableRow>
						<TableHead className="py-2 px-3 text-center font-semibold w-16">
							序号
						</TableHead>
						<TableHead className="py-2 px-3 text-left font-semibold">
							工序编码
						</TableHead>
						<TableHead className="py-2 px-3 text-left font-semibold">
							工序名称
						</TableHead>
						<TableHead className="py-2 px-3 text-left font-semibold">
							工序工艺规格
						</TableHead>
						<TableHead className="py-2 px-3 text-right font-semibold">
							准备工时(分)
						</TableHead>
						<TableHead className="py-2 px-3 text-right font-semibold">
							清理工时(分)
						</TableHead>
						<TableHead className="py-2 px-3 text-right font-semibold">
							标准工时(小时)
						</TableHead>
						<TableHead className="py-2 px-3 text-center font-semibold">
							质量检查点
						</TableHead>
						<TableHead className="py-2 px-3 text-left font-semibold">
							作业标准要求 (SOP)
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody className="divide-y">
					{operations.map((op, idx) => (
						<TableRow key={idx} className="hover:bg-muted/20">
							<TableCell className="py-2 px-3 text-center font-mono text-muted-foreground">
								{idx + 1}
							</TableCell>
							<TableCell className="py-2 px-3 font-mono text-muted-foreground">
								{op.operationCode}
							</TableCell>
							<TableCell className="py-2 px-3 font-medium text-foreground">
								{op.operationName}
							</TableCell>
							<TableCell className="py-2 px-3 font-medium text-xs">
								{op.processingSpecificationName ? (
									<Badge variant="outline" className="font-normal text-xs">
										{op.processingSpecificationName}
									</Badge>
								) : (
									<span className="text-muted-foreground font-mono">-</span>
								)}
							</TableCell>
							<TableCell className="py-2 px-3 text-right font-mono text-muted-foreground">
								{op.setupMinutes ?? "-"}
							</TableCell>
							<TableCell className="py-2 px-3 text-right font-mono text-muted-foreground">
								{op.cleanupMinutes ?? "-"}
							</TableCell>
							<TableCell className="py-2 px-3 text-right font-mono text-muted-foreground">
								{op.standardLaborHours ?? "-"}
							</TableCell>
							<TableCell className="py-2 px-3 text-center">
								{op.qualityCheckpoint ? (
									<Badge
										variant="destructive"
										size="sm"
										className="text-[10px]"
									>
										关键质检
									</Badge>
								) : (
									<span className="text-muted-foreground text-xs">常规</span>
								)}
							</TableCell>
							<TableCell className="py-2 px-3 text-muted-foreground">
								{op.instructionText || "-"}
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
