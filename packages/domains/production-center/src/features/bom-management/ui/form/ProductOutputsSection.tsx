import { CheckCircle2, Layers, X } from "lucide-react";
import { AuthField, Badge, Button, Combobox, Input, Switch } from "@base/ui";
import { BomSubject, BomField } from "../../contract";
import type { BomFormOptions } from "../../types";

export interface ProductOutputsSectionProps {
	readonly isView: boolean;
	readonly productId: string;
	readonly primaryQuantity: number;
	readonly setPrimaryQuantity: (val: number) => void;
	readonly primaryUnitId: string;
	readonly setPrimaryUnitId: (val: string) => void;
	readonly byProductIds: readonly string[];
	readonly byProductCandidateOptions: readonly {
		readonly value: string;
		readonly label: string;
	}[];
	readonly handleAddByProduct: (pId: string | null) => void;
	readonly handleRemoveByProduct: (pId: string) => void;
	readonly totalYieldEnabled: boolean;
	readonly setTotalYieldEnabled: (val: boolean) => void;
	readonly totalYieldRate: number;
	readonly setTotalYieldRate: (val: number) => void;
	readonly formOptions: BomFormOptions;
}

/**
 * 成品主产出、联副产品多选与总出成率折算区块积木
 */
export function ProductOutputsSection({
	isView,
	productId,
	primaryQuantity,
	setPrimaryQuantity,
	primaryUnitId,
	setPrimaryUnitId,
	byProductIds,
	byProductCandidateOptions,
	handleAddByProduct,
	handleRemoveByProduct,
	totalYieldEnabled,
	setTotalYieldEnabled,
	totalYieldRate,
	setTotalYieldRate,
	formOptions,
}: ProductOutputsSectionProps) {
	const productName =
		formOptions.products.find((p) => p.id === productId)?.name ||
		"请在上文选择 BOM 商品";
	const primaryUnitName =
		formOptions.units.find((u) => u.id === primaryUnitId)?.name || primaryUnitId;

	return (
		<div className="space-y-4">
			{/* 成品主产出设置 */}
			<div className="rounded-xl border p-4 bg-muted/20 flex items-center justify-between text-xs">
				<div className="flex items-center gap-3">
					<CheckCircle2 className="size-4 text-blue-600" />
					<div>
						<div className="font-bold text-foreground">标准批次主产出成品</div>
						<div className="text-muted-foreground">{productName}</div>
					</div>
				</div>
				<div className="flex items-center gap-3">
					<span className="font-semibold">产出数量:</span>
					<Input
						type="number"
						step="0.01"
						value={primaryQuantity}
						disabled={isView}
						onChange={(e) => setPrimaryQuantity(Number(e.target.value))}
						className="h-9 w-28 text-xs font-mono font-bold text-blue-600"
					/>
					{isView ? (
						<div className="h-9 px-3 bg-muted/40 rounded-md border flex items-center font-medium">
							{primaryUnitName}
						</div>
					) : (
						<div className="w-36">
							<Combobox
								value={primaryUnitId}
								placeholder="单位"
								options={formOptions.units.map((u) => ({
									value: u.id,
									label: u.name || u.code,
								}))}
								onChange={(val) => setPrimaryUnitId(val || "")}
							/>
						</div>
					)}
				</div>
			</div>

			{/* 副产品多选产出 (观麦原型：多选副产品) */}
			<div className="rounded-xl border p-4 bg-muted/15 space-y-3 text-xs">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2.5">
						<Layers className="size-4 text-amber-600" />
						<div>
							<div className="font-bold text-foreground">
								副产品产出清单 (可多选)
							</div>
							<div className="text-muted-foreground text-[11px]">
								切配分割时附带产出的可用副产品物资（如鲜猪皮、精碎肉、青椒碎料等），后续工单报工按需称重登记
							</div>
						</div>
					</div>
					<Badge variant="outline" className="text-[11px] font-normal">
						已选 {byProductIds.length} 项副产品
					</Badge>
				</div>

				{/* 观麦风格副产品标签与添加器 */}
				<div className="flex flex-wrap items-center gap-2 pt-1">
					{byProductIds.length === 0 && isView && (
						<span className="text-muted-foreground text-xs">无副产品</span>
					)}
					{byProductIds.map((bpId) => {
						const prod = formOptions.products.find((p) => p.id === bpId);
						return (
							<Badge
								key={bpId}
								variant="secondary"
								className="h-7 px-2.5 gap-1.5 text-xs rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border-amber-200 dark:border-amber-800"
							>
								<span>{prod?.name || bpId}</span>
								{!isView && (
									<Button
										type="button"
										variant="ghost"
										size="icon"
										onClick={() => handleRemoveByProduct(bpId)}
										className="size-4 p-0 text-amber-700 dark:text-amber-400 hover:bg-transparent"
									>
										<X className="size-3" />
									</Button>
								)}
							</Badge>
						);
					})}

					{!isView && (
						<div className="w-56">
							<Combobox
								value=""
								placeholder="+ 添加副产品..."
								options={byProductCandidateOptions}
								onChange={handleAddByProduct}
							/>
						</div>
					)}
				</div>
			</div>

			{/* 总出成率折算 (使用封装的 AuthField 权限控件) */}
			<AuthField
				subject={BomSubject}
				field={BomField.TOTAL_YIELD_RATE}
				action={isView ? "read" : "update"}
			>
				<div className="flex items-center justify-between bg-muted/40 p-4 rounded-xl border text-xs">
					<div className="flex items-center gap-3">
						<Switch
							checked={totalYieldEnabled}
							disabled={isView}
							onCheckedChange={setTotalYieldEnabled}
						/>
						<div>
							<span className="font-bold text-foreground">
								启用总出成率折算控制
							</span>
							<p className="text-muted-foreground text-[11px] mt-0.5">
								开启后忽略单一工序出成率，物料试算直接以该总出成率指标折算
							</p>
						</div>
					</div>
					{totalYieldEnabled && (
						<div className="flex items-center gap-2 font-mono">
							<span className="font-semibold">指标出成率:</span>
							<Input
								type="number"
								value={totalYieldRate}
								disabled={isView}
								onChange={(e) => setTotalYieldRate(Number(e.target.value))}
								className="h-9 w-24 text-xs font-bold text-emerald-600"
							/>
							<span>%</span>
						</div>
					)}
				</div>
			</AuthField>
		</div>
	);
}
