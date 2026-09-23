import { Layers } from "lucide-react";
import { AuthField, Button, Input, Textarea, Combobox } from "@base/ui";
import { BOM_TYPES, BomSubject, BomField, type BomType } from "../../contract";
import type { BomDetailDto, BomFormOptions } from "../../types";

export interface BasicInfoSectionProps {
	readonly isView: boolean;
	readonly isEdit: boolean;
	readonly bomType: BomType;
	readonly setBomType: (type: BomType) => void;
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
 * BOM 基本信息区块积木：BOM 类型选择、归属主商品、产线、编码、名称与说明
 */
export function BasicInfoSection({
	isView,
	isEdit,
	bomType,
	setBomType,
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
		<div className="space-y-6">
			{/* 类型切换 (新建态特有) */}
			{!isEdit && !isView && (
				<AuthField
					subject={BomSubject}
					field={BomField.BOM_TYPE}
					action={writeAction}
				>
					<div className="flex items-center gap-2 bg-muted/40 p-1.5 rounded-xl border w-fit">
						<span className="text-xs font-semibold text-muted-foreground px-2">
							BOM 类型:
						</span>
						<Button
							type="button"
							variant={bomType === BOM_TYPES.PROCESSING ? "secondary" : "ghost"}
							size="sm"
							onClick={() => setBomType(BOM_TYPES.PROCESSING)}
							className="h-7 text-xs font-bold"
						>
							单品BOM
						</Button>
						<Button
							type="button"
							variant={bomType === BOM_TYPES.FORMULA ? "secondary" : "ghost"}
							size="sm"
							onClick={() => setBomType(BOM_TYPES.FORMULA)}
							className="h-7 text-xs font-bold"
						>
							组合BOM
						</Button>
						<Button
							type="button"
							variant={bomType === BOM_TYPES.PACKAGING ? "secondary" : "ghost"}
							size="sm"
							onClick={() => setBomType(BOM_TYPES.PACKAGING)}
							className="h-7 text-xs font-bold"
						>
							包装BOM
						</Button>
					</div>
				</AuthField>
			)}

			{/* 区块 1：基本信息卡片 */}
			<div className="bg-card rounded-xl border shadow-sm p-6 space-y-4">
				<div className="border-b pb-3">
					<h2 className="text-base font-bold text-foreground flex items-center gap-2">
						<Layers className="size-4 text-blue-600" /> 基本信息
					</h2>
					<p className="text-xs text-muted-foreground mt-0.5">
						确定本生产方案的归属主商品、方案名称、产线与业务编码
					</p>
				</div>

				<div className="grid grid-cols-2 gap-6 text-xs">
					{/* BOM 商品 */}
					<AuthField
						subject={BomSubject}
						field={BomField.PRODUCT_ID}
						action={writeAction}
						label="* BOM主产出商品"
					>
						{isView || isEdit ? (
							<div className="h-10 px-3.5 bg-muted/40 rounded-md border flex items-center font-medium text-foreground">
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
							<div className="h-10 px-3.5 bg-muted/40 rounded-md border flex items-center text-foreground">
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
							className="h-10 text-xs"
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
							className="h-10 text-xs font-mono"
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
							rows={3}
							className="text-xs"
						/>
					</AuthField>
				</div>
			</div>
		</div>
	);
}
