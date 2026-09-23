import {
	Table,
	TableHeader,
	TableBody,
	TableHead,
	TableRow,
	TableCell,
	Badge,
} from "@base/ui";
import type { BomOutputItemDto } from "../../types";

export interface OutputsTableTabProps {
	readonly outputs: readonly BomOutputItemDto[];
}

/**
 * 详情抽屉：产出商品明细表格选项卡积木（主产品与联副产品）
 */
export function OutputsTableTab({ outputs }: OutputsTableTabProps) {
	return (
		<div className="rounded-lg border overflow-hidden">
			<Table className="w-full text-xs">
				<TableHeader className="bg-muted/50 border-b">
					<TableRow>
						<TableHead className="py-2 px-3 text-left font-semibold">
							产出商品编码
						</TableHead>
						<TableHead className="py-2 px-3 text-left font-semibold">
							产出商品名称
						</TableHead>
						<TableHead className="py-2 px-3 text-right font-semibold">
							计划产出数量
						</TableHead>
						<TableHead className="py-2 px-3 text-left font-semibold">
							单位
						</TableHead>
						<TableHead className="py-2 px-3 text-center font-semibold">
							产出角色
						</TableHead>
						<TableHead className="py-2 px-3 text-left font-semibold">
							备注说明
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody className="divide-y">
					{outputs.map((out, idx) => (
						<TableRow key={idx} className="hover:bg-muted/20">
							<TableCell className="py-2 px-3 font-mono text-muted-foreground">
								{out.productCode}
							</TableCell>
							<TableCell className="py-2 px-3 font-medium text-foreground">
								{out.productName}
							</TableCell>
							<TableCell className="py-2 px-3 text-right font-mono font-semibold">
								{out.quantity}
							</TableCell>
							<TableCell className="py-2 px-3 text-muted-foreground">
								{out.unitName}
							</TableCell>
							<TableCell className="py-2 px-3 text-center">
								<Badge
									variant={
										out.outputRole === "PRIMARY" ? "default" : "secondary"
									}
									size="sm"
									className={
										out.outputRole === "PRIMARY"
											? "bg-blue-600 hover:bg-blue-600"
											: "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300"
									}
								>
									{out.outputRole === "PRIMARY" ? "主产物" : "联副产品"}
								</Badge>
							</TableCell>
							<TableCell className="py-2 px-3 text-muted-foreground">
								{out.remark || "-"}
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
