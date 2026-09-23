import { Box, Plus, Trash2 } from "lucide-react";
import {
	Button,
	Switch,
	Combobox,
	Input,
	Table,
	TableHeader,
	TableBody,
	TableHead,
	TableRow,
	TableCell,
} from "@base/ui";
import { useAbility } from "@base/authorization";
import { BOM_TYPES, MATERIAL_ROLES, BomSubject, BomField, type BomType } from "../../contract";
import type { BomFormOptions } from "../../types";
import type { FormInputRow } from "./types";

export interface MaterialInputsSectionProps {
	readonly isView: boolean;
	readonly bomType: BomType;
	readonly isRatioMode: boolean;
	readonly setIsRatioMode: (val: boolean) => void;
	readonly inputs: readonly FormInputRow[];
	readonly formOptions: BomFormOptions;
	readonly handleAddInput: () => void;
	readonly handleRemoveInput: (idx: number) => void;
	readonly handleUpdateInput: (idx: number, field: string, value: unknown) => void;
}

interface InputTableRowProps {
	readonly inp: FormInputRow;
	readonly idx: number;
	readonly isView: boolean;
	readonly isRatioMode: boolean;
	readonly bomType: BomType;
	readonly formOptions: BomFormOptions;
	readonly canReadCookedYield: boolean;
	readonly canWriteCookedYield: boolean;
	readonly onUpdate: (idx: number, field: string, value: unknown) => void;
	readonly onRemove: (idx: number) => void;
}

function InputTableRow({
	inp,
	idx,
	isView,
	isRatioMode,
	bomType,
	formOptions,
	canReadCookedYield,
	canWriteCookedYield,
	onUpdate,
	onRemove,
}: InputTableRowProps) {
	const productName =
		formOptions.products.find((p) => p.id === inp.productId)?.name || inp.productId;
	const unitName =
		formOptions.units.find((u) => u.id === inp.unitId)?.name || inp.unitId;

	const roleLabel =
		inp.materialRole === MATERIAL_ROLES.MAIN
			? "主料"
			: inp.materialRole === MATERIAL_ROLES.AUXILIARY
				? "辅料"
				: "包材";

	return (
		<TableRow>
			<TableCell className="py-1.5 px-3">
				{isView ? (
					<div className="font-medium">{productName}</div>
				) : (
					<Combobox
						value={inp.productId}
						placeholder="选择物料..."
						options={formOptions.products.map((p) => ({
							value: p.id,
							label: `${p.name} (${p.code})`,
						}))}
						onChange={(val) => onUpdate(idx, "productId", val)}
					/>
				)}
			</TableCell>
			<TableCell className="py-1.5 px-3">
				<Input
					type="number"
					step="0.01"
					value={isRatioMode ? inp.ratio : inp.quantity}
					disabled={isView}
					onChange={(e) =>
						onUpdate(idx, isRatioMode ? "ratio" : "quantity", e.target.value)
					}
					className="h-8 text-xs font-mono"
				/>
			</TableCell>
			<TableCell className="py-1.5 px-3">
				{isView ? (
					<div className="font-medium text-xs">{unitName}</div>
				) : (
					<Combobox
						value={inp.unitId}
						placeholder="单位"
						options={formOptions.units.map((u) => ({
							value: u.id,
							label: u.name || u.code,
						}))}
						onChange={(val) => onUpdate(idx, "unitId", val || "")}
					/>
				)}
			</TableCell>
			<TableCell className="py-1.5 px-3">
				{isView ? (
					<div className="font-medium text-xs">{roleLabel}</div>
				) : (
					<Combobox
						value={inp.materialRole}
						placeholder="物料角色"
						options={[
							{ value: MATERIAL_ROLES.MAIN, label: "主料" },
							{ value: MATERIAL_ROLES.AUXILIARY, label: "辅料" },
							{ value: MATERIAL_ROLES.PACKAGING, label: "包材" },
						]}
						onChange={(val) =>
							onUpdate(idx, "materialRole", val || MATERIAL_ROLES.MAIN)
						}
					/>
				)}
			</TableCell>
			{canReadCookedYield && (
				<TableCell className="py-1.5 px-3">
					<Input
						type="number"
						value={inp.cookedYieldRate}
						disabled={isView || !canWriteCookedYield}
						onChange={(e) => onUpdate(idx, "cookedYieldRate", e.target.value)}
						className="h-8 text-xs font-mono"
					/>
				</TableCell>
			)}
			{!isView && bomType !== BOM_TYPES.PROCESSING && (
				<TableCell className="py-1.5 px-3 text-center">
					<Button
						type="button"
						variant="ghost"
						size="icon"
						onClick={() => onRemove(idx)}
						className="size-7 text-destructive hover:bg-destructive/10"
					>
						<Trash2 className="size-3.5" />
					</Button>
				</TableCell>
			)}
		</TableRow>
	);
}

/**
 * 原料投入与配比清单区块积木：支持固定数量与占比模式、添加/删除物料行、设置物料角色与出成率
 */
export function MaterialInputsSection({
	isView,
	bomType,
	isRatioMode,
	setIsRatioMode,
	inputs,
	formOptions,
	handleAddInput,
	handleRemoveInput,
	handleUpdateInput,
}: MaterialInputsSectionProps) {
	const ability = useAbility();
	const canReadCookedYield = ability.can("read", BomSubject, BomField.DEFAULT_COOKED_YIELD_RATE);
	const canWriteCookedYield = ability.can(isView ? "read" : "update", BomSubject, BomField.DEFAULT_COOKED_YIELD_RATE);

	return (
		<div className="bg-card rounded-xl border shadow-xs p-4 space-y-3">
			<div className="border-b pb-1.5 flex items-center justify-between">
				<h2 className="text-sm font-bold text-foreground flex items-center gap-2">
					<Box className="size-4 text-blue-600" /> 原料投入与配比清单
				</h2>
				{bomType !== BOM_TYPES.PROCESSING && !isView && (
					<div className="flex items-center gap-2.5 text-xs bg-muted/40 px-2.5 py-1 rounded-lg border">
						<span className="font-semibold">BOM占比模式:</span>
						<Switch checked={isRatioMode} onCheckedChange={setIsRatioMode} />
						<span className="text-muted-foreground">
							{isRatioMode ? "配方占比(%)" : "固定数量"}
						</span>
					</div>
				)}
			</div>

			{/* 原料投入明细表 */}
			<div className="rounded-lg border overflow-hidden">
				<div className="bg-muted/40 px-3.5 py-2 border-b flex items-center justify-between">
					<span className="text-xs font-bold text-foreground">原料投入行</span>
					{bomType !== BOM_TYPES.PROCESSING && !isView && (
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={handleAddInput}
							className="h-6.5 px-2 text-xs gap-1"
						>
							<Plus className="size-3" /> 添加原料行
						</Button>
					)}
				</div>
				<Table className="w-full text-xs">
					<TableHeader className="bg-muted/20">
						<TableRow>
							<TableHead className="py-2 px-3 font-semibold w-72">
								投入物料商品
							</TableHead>
							<TableHead className="py-2 px-3 font-semibold w-36">
								{isRatioMode ? "配方占比(%)" : "标准毛投入"}
							</TableHead>
							<TableHead className="py-2 px-3 font-semibold w-36">
								投入单位
							</TableHead>
							<TableHead className="py-2 px-3 font-semibold w-32">
								物料角色
							</TableHead>
							{canReadCookedYield && (
								<TableHead className="py-2 px-3 font-semibold w-32">
									熟出成率(%)
								</TableHead>
							)}
							{!isView && bomType !== BOM_TYPES.PROCESSING && (
								<TableHead className="py-2 px-3 text-center w-16">操作</TableHead>
							)}
						</TableRow>
					</TableHeader>
					<TableBody className="divide-y">
						{inputs.map((inp, idx) => (
							<InputTableRow
								key={idx}
								inp={inp}
								idx={idx}
								isView={isView}
								isRatioMode={isRatioMode}
								bomType={bomType}
								formOptions={formOptions}
								canReadCookedYield={canReadCookedYield}
								canWriteCookedYield={canWriteCookedYield}
								onUpdate={handleUpdateInput}
								onRemove={handleRemoveInput}
							/>
						))}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
