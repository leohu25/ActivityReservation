import { Layers } from "lucide-react";
import { AuthField, Input, Textarea, Combobox } from "@base/ui";
import { BomSubject, BomField } from "../../contract";
import type { BomDetailDto, BomFormOptions } from "../../types";

export interface BasicInfoSectionProps {
	readonly isView: boolean;
	readonly isEdit: boolean;
	readonly productId: string;
	readonly handleSelectProduct: (pId: string) => void;
	readonly productionLineId: string;
	readonly setProductionLineId: (lineId: string) => void;
	readonly name: string;
	readonly setName: (name: string) => void;
	readonly code: string;
	readonly setCode: (code: string) => void;
	readonly description: string;
	readonly setDescription: (desc: string) => void;
	readonly initialDetail?: BomDetailDto | null;
	readonly formOptions: BomFormOptions;
}

/**
 * BOM 基本信息区块积木：归属主商品、产线、编码、名称与说明 (BOM 类型由顶栏插槽集中管控)
 */
export function BasicInfoSection({
	isView,
	isEdit,
	productId,
	handleSelectProduct,
	productionLineId,
	setProductionLineId,
	name,
	setName,
	code,
	setCode,
	description,
	setDescription,
	initialDetail,
	formOptions,
}: BasicInfoSectionProps) {
	const writeAction = isView ? "read" : isEdit ? "update" : "create";

	return (
		<div className="bg-card rounded-xl border shadow-xs p-4 space-y-3">
			<div className="border-b pb-1.5">
				<h2 className="text-sm font-bold text-foreground flex items-center gap-2">
					<Layers className="size-4 text-blue-600" /> 基本信息
				</h2>
			</div>

			<div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
				{/* BOM 商品 */}
				<AuthField
					subject={BomSubject}
					field={BomField.PRODUCT_ID}
					action={writeAction}
					label="* BOM主产出商品"
				>
					{isView || isEdit ? (
						<div className="h-8.5 px-3 bg-muted/40 rounded-md border flex items-center font-medium text-foreground">
							{initialDetail?.primaryProduct.name} (
							{initialDetail?.primaryProduct.code})
						</div>
					) : (
						<Combobox
							value={productId}
							placeholder="选择或搜索目标商品..."
							options={formOptions.products.map((p) => ({
								value: p.id,
								label: `${p.name} (${p.code})`,
							}))}
							onChange={handleSelectProduct}
						/>
					)}
				</AuthField>

				{/* 生产产线 */}
				<AuthField
					subject={BomSubject}
					field={BomField.PRODUCTION_LINE_ID}
					action={writeAction}
					label="生产产线"
				>
					{isView ? (
						<div className="h-8.5 px-3 bg-muted/40 rounded-md border flex items-center text-foreground">
							{initialDetail?.currentVersion.productionLineName || "未指定产线"}
						</div>
					) : (
						<Combobox
							value={productionLineId}
							placeholder="请选择产线 (选填)..."
							clearable={true}
							options={formOptions.productionLines.map((l) => ({
								value: l.id,
								label: `${l.name} (${l.code})`,
							}))}
							onChange={(val) => setProductionLineId(val || "")}
						/>
					)}
				</AuthField>

				{/* BOM 名称 (受控于单一事实来源 BomField.NAME) */}
				<AuthField
					subject={BomSubject}
					field={BomField.NAME}
					action={writeAction}
					label="* BOM名称"
				>
					<Input
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="如：青椒段5cm标准切配BOM"
						className="h-8.5 text-xs"
					/>
				</AuthField>

				{/* BOM 编码 (受控于单一事实来源 BomField.CODE) */}
				<AuthField
					subject={BomSubject}
					field={BomField.CODE}
					action={writeAction}
					label="* BOM编码"
				>
					<Input
						value={code}
						onChange={(e) => setCode(e.target.value)}
						placeholder="如：BOM260901"
						className="h-8.5 text-xs font-mono"
					/>
				</AuthField>

				{/* 描述 (受控于单一事实来源 BomField.DESCRIPTION) */}
				<AuthField
					subject={BomSubject}
					field={BomField.DESCRIPTION}
					action={writeAction}
					label="方案描述 / 工艺说明"
					className="col-span-2"
				>
					<Textarea
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						placeholder="输入该生产方案的具体说明与配方备注..."
						rows={2}
						className="text-xs min-h-[50px]"
					/>
				</AuthField>
			</div>
		</div>
	);
}
