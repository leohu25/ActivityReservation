import { CheckCircle2, Layers, Plus, Trash2 } from "lucide-react";
import {
	AuthField,
	Badge,
	Button,
	Combobox,
	Input,
	Switch,
	Table,
	TableHeader,
	TableBody,
	TableHead,
	TableRow,
	TableCell,
} from "@base/ui";
import { BomSubject, BomField } from "../../contract";
import type { BomFormOptions } from "../../types";
import type { FormByProductRow } from "./types";

export interface ProductOutputsSectionProps {
	readonly isView: boolean;
	readonly productId: string;
	readonly primaryQuantity: number;
	readonly setPrimaryQuantity: (val: number) => void;
	readonly primaryUnitId: string;
	readonly setPrimaryUnitId: (val: string) => void;
	readonly byProducts: readonly FormByProductRow[];
	readonly byProductCandidateOptions: readonly {
		readonly value: string;
		readonly label: string;
	}[];
	readonly handleAddByProduct: (pId: string | null) => void;
	readonly handleRemoveByProduct: (idx: number) => void;
	readonly handleUpdateByProduct: (
		idx: number,
		field: keyof FormByProductRow,
		value: unknown,
	) => void;
	readonly totalYieldEnabled: boolean;
	readonly setTotalYieldEnabled: (val: boolean) => void;
	readonly totalYieldRate: number;
	readonly setTotalYieldRate: (val: number) => void;
	readonly formOptions: BomFormOptions;
}

/**
 * 成品主产出、联副产品明细与总出成率折算区块积木
 */
export function ProductOutputsSection({
	isView,
	productId,
	primaryQuantity,
	setPrimaryQuantity,
	primaryUnitId,
	setPrimaryUnitId,
	byProducts,
	byProductCandidateOptions,
	handleAddByProduct,
	handleRemoveByProduct,
	handleUpdateByProduct,
	totalYieldEnabled,
	setTotalYieldEnabled,
	totalYieldRate,
	setTotalYieldRate,
	formOptions,
}: ProductOutputsSectionProps) {
	const currentProduct = formOptions.products.find((p) => p.id === productId);
	const productName = currentProduct?.name || "请在上文选择 BOM 商品";

	// 主产品单位候选：严格限制为该商品的单位库 (基础单位、生产单位、换算单位)
	const primaryUnitOptions =
		currentProduct && currentProduct.availableUnits.length > 0
			? currentProduct.availableUnits.map((u) => ({
					value: u.id,
					label: `${u.name || u.code}${u.isDefaultProduction ? " (生产单位)" : u.isInventory ? " (库存单位)" : ""}`,
				}))
			: formOptions.units.map((u) => ({
					value: u.id,
					label: u.name || u.code,
				}));

	const primaryUnitName =
		primaryUnitOptions.find((u) => u.value === primaryUnitId)?.label ||
		formOptions.units.find((u) => u.id === primaryUnitId)?.name ||
		primaryUnitId;

	return (
		<div className="bg-card rounded-xl border shadow-xs p-4 space-y-3">
			{/* 区块统一标准头部 */}
			<div className="border-b pb-1.5 flex items-center justify-between">
				<h2 className="text-sm font-bold text-foreground flex items-center gap-2">
					<CheckCircle2 className="size-4 text-blue-600" /> 成品与副产品产出
				</h2>
			</div>

			{/* 成品主产出设置 */}
			<div className="rounded-lg border border-border/80 p-2.5 bg-muted/25 flex flex-wrap items-center justify-between gap-3 text-xs">
				<div className="flex items-center gap-2.5">
					<CheckCircle2 className="size-4 text-blue-600 shrink-0" />
					<div>
						<div className="font-bold text-foreground flex items-center gap-1.5">
							标准批次主产出成品
							<Badge variant="outline" className="text-[10px] text-blue-600 border-blue-200">主产品</Badge>
						</div>
						<div className="text-muted-foreground">{productName}</div>
					</div>
				</div>
				<div className="flex items-center gap-2.5">
					<span className="font-semibold text-muted-foreground">产出数量:</span>
					<Input
						type="number"
						step="0.01"
						value={primaryQuantity}
						disabled={isView}
						onChange={(e) => setPrimaryQuantity(Number(e.target.value))}
						className="h-8 w-24 text-xs font-mono font-bold text-blue-600"
					/>
					<span className="font-semibold text-muted-foreground">产出单位:</span>
					{isView ? (
						<div className="h-8 px-2.5 bg-muted/40 rounded-md border flex items-center font-medium">
							{primaryUnitName}
						</div>
					) : (
						<div className="w-40">
							<Combobox
								value={primaryUnitId}
								placeholder="从商品单位库选择..."
								options={primaryUnitOptions}
								onChange={(val) => setPrimaryUnitId(val || "")}
							/>
						</div>
					)}
				</div>
			</div>

			{/* 副产品明细产出清单 (支持数量、商品单位库与成本分摊比例) */}
			<div className="rounded-lg border border-border/80 p-2.5 bg-muted/25 space-y-2 text-xs">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Layers className="size-4 text-amber-600" />
						<span className="font-bold text-foreground">
							副产品产出清单 (明细表)
						</span>
					</div>
					<Badge variant="outline" className="text-[11px] font-normal">
						已维护 {byProducts.length} 项副产品
					</Badge>
				</div>

				{byProducts.length === 0 ? (
					<div className="text-center py-3 text-muted-foreground text-xs bg-background/50 rounded border border-dashed">
						暂无副产品产出记录
					</div>
				) : (
					<div className="overflow-x-auto rounded border bg-background">
						<Table className="text-xs">
							<TableHeader className="bg-muted/40">
								<TableRow className="hover:bg-transparent">
									<TableHead className="w-12 text-center py-1.5 px-2">#</TableHead>
									<TableHead className="min-w-[180px] py-1.5 px-3">副产品商品</TableHead>
									<TableHead className="w-32 py-1.5 px-3">产出数量</TableHead>
									<TableHead className="w-44 py-1.5 px-3">产出单位</TableHead>
									<TableHead className="w-28 py-1.5 px-3">成本分摊比例</TableHead>
									{!isView && (
										<TableHead className="w-16 text-center py-1.5 px-2">操作</TableHead>
									)}
								</TableRow>
							</TableHeader>
							<TableBody>
								{byProducts.map((bp, idx) => {
									const bpProd = formOptions.products.find(
										(p) => p.id === bp.productId,
									);
									const bpUnitOptions =
										bpProd && bpProd.availableUnits.length > 0
											? bpProd.availableUnits.map((u) => ({
													value: u.id,
													label: `${u.name || u.code}${u.isDefaultProduction ? " (生产)" : u.isInventory ? " (库存)" : ""}`,
												}))
											: formOptions.units.map((u) => ({
													value: u.id,
													label: u.name || u.code,
												}));

									return (
										<TableRow key={bp.productId}>
											<TableCell className="text-center font-mono text-muted-foreground py-1.5 px-2">
												{idx + 1}
											</TableCell>
											<TableCell className="font-medium py-1.5 px-3">
												{bpProd?.name || bp.productId}
												<span className="text-muted-foreground ml-1.5 text-[11px] font-mono">
													({bpProd?.code || "-"})
												</span>
											</TableCell>
											<TableCell className="py-1.5 px-3">
												<Input
													type="number"
													step="0.01"
													min="0.000001"
													value={bp.quantity}
													disabled={isView}
													onChange={(e) =>
														handleUpdateByProduct(
															idx,
															"quantity",
															Number(e.target.value),
														)
													}
													className="h-8 text-xs font-mono font-semibold"
												/>
											</TableCell>
											<TableCell className="py-1.5 px-3">
												{isView ? (
													<span className="font-medium">
														{bpUnitOptions.find((u) => u.value === bp.unitId)
															?.label || bp.unitId}
													</span>
												) : (
													<Combobox
														value={bp.unitId}
														placeholder="从单位库选择..."
														options={bpUnitOptions}
														onChange={(val) =>
															handleUpdateByProduct(
																idx,
																"unitId",
																val || "",
															)
														}
													/>
												)}
											</TableCell>
											<TableCell className="py-1.5 px-3">
												<div className="flex items-center gap-1">
													<Input
														type="number"
														step="1"
														min="0"
														max="100"
														value={bp.costAllocationRatio ?? ""}
														placeholder="可选"
														disabled={isView}
														onChange={(e) =>
															handleUpdateByProduct(
																idx,
																"costAllocationRatio",
																e.target.value
																	? Number(e.target.value)
																	: undefined,
															)
														}
														className="h-8 text-xs font-mono text-right"
													/>
													<span className="text-muted-foreground text-xs">%</span>
												</div>
											</TableCell>
											{!isView && (
												<TableCell className="text-center py-1.5 px-2">
													<Button
														type="button"
														variant="ghost"
														size="icon"
														onClick={() => handleRemoveByProduct(idx)}
														className="size-7 text-muted-foreground hover:text-destructive"
													>
														<Trash2 className="size-3.5" />
													</Button>
												</TableCell>
											)}
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</div>
				)}

				{!isView && (
					<div className="flex items-center gap-2 pt-1">
						<div className="w-56">
							<Combobox
								value=""
								placeholder="+ 选择添加副产品商品..."
								options={byProductCandidateOptions}
								onChange={handleAddByProduct}
							/>
						</div>
						<span className="text-[11px] text-muted-foreground">
							(自动带出该副产品的生产/库存单位，可按需修改数量与单位)
						</span>
					</div>
				)}
			</div>

			{/* 总出成率折算 (使用封装的 AuthField 权限控件) */}
			<AuthField
				subject={BomSubject}
				field={BomField.TOTAL_YIELD_RATE}
				action={isView ? "read" : "update"}
			>
				<div className="flex items-center justify-between bg-muted/25 p-2.5 rounded-lg border border-border/80 text-xs">
					<div className="flex items-center gap-2.5">
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
						<div className="flex items-center gap-1.5 font-mono">
							<span className="font-semibold">指标出成率:</span>
							<Input
								type="number"
								value={totalYieldRate}
								disabled={isView}
								onChange={(e) => setTotalYieldRate(Number(e.target.value))}
								className="h-8 w-20 text-xs font-bold text-emerald-600"
							/>
							<span>%</span>
						</div>
					)}
				</div>
			</AuthField>
		</div>
	);
}
