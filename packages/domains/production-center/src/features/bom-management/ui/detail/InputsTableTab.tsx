import {
	Table,
	TableHeader,
	TableBody,
	TableHead,
	TableRow,
	TableCell,
	Badge,
} from "@base/ui";
import { useAbility } from "@base/authorization";
import { BomSubject, BomField } from "../../contract";
import type { BomInputItemDto } from "../../types";

export interface InputsTableTabProps {
	readonly inputs: readonly BomInputItemDto[];
}

/**
 * 详情抽屉：投入物料明细表格选项卡积木
 */
export function InputsTableTab({ inputs }: InputsTableTabProps) {
	const ability = useAbility();
	const canReadCookedYield = ability.can("read", BomSubject, BomField.DEFAULT_COOKED_YIELD_RATE);

	return (
		<div className="rounded-lg border overflow-hidden">
			<Table className="w-full text-xs">
				<TableHeader className="bg-muted/50 border-b">
					<TableRow>
						<TableHead className="py-2 px-3 text-left font-semibold">
							物料编码
						</TableHead>
						<TableHead className="py-2 px-3 text-left font-semibold">
							投入物料名称
						</TableHead>
						<TableHead className="py-2 px-3 text-right font-semibold">
							标准毛投入
						</TableHead>
						<TableHead className="py-2 px-3 text-left font-semibold">
							单位
						</TableHead>
						<TableHead className="py-2 px-3 text-center font-semibold">
							物料角色
						</TableHead>
						{canReadCookedYield && (
							<TableHead className="py-2 px-3 text-right font-semibold">
								熟出成率
							</TableHead>
						)}
						<TableHead className="py-2 px-3 text-left font-semibold">
							供应策略
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody className="divide-y">
					{inputs.map((inp, idx) => (
						<TableRow key={idx} className="hover:bg-muted/20">
							<TableCell className="py-2 px-3 font-mono text-muted-foreground">
								{inp.productCode}
							</TableCell>
							<TableCell className="py-2 px-3 font-medium text-foreground">
								{inp.productName}
							</TableCell>
							<TableCell className="py-2 px-3 text-right font-mono font-semibold">
								{inp.quantity ??
									(inp.ratio ? `${Number(inp.ratio) * 100}%` : "-")}
							</TableCell>
							<TableCell className="py-2 px-3 text-muted-foreground">
								{inp.unitName}
							</TableCell>
							<TableCell className="py-2 px-3 text-center">
								<Badge variant="outline" size="sm">
									{inp.materialRole === "MAIN"
										? "主料"
										: inp.materialRole === "AUXILIARY"
											? "辅料"
											: "包材"}
								</Badge>
							</TableCell>
							{canReadCookedYield && (
								<TableCell className="py-2 px-3 text-right font-mono text-muted-foreground">
									{inp.cookedYieldRate
										? `${Number(inp.cookedYieldRate) * 100}%`
										: "-"}
								</TableCell>
							)}
							<TableCell className="py-2 px-3 text-muted-foreground text-xs">
								{inp.supplyPolicy === "EXTERNAL"
									? "外购"
									: inp.supplyPolicy === "MAKE"
										? "自制"
										: "跟随默认"}
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
