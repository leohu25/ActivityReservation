"use client";

import React, { useState, useEffect, useCallback, useId } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
	Button,
	Input,
	Textarea,
	Switch,
	Badge,
	Combobox,
	Select,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectItem,
	toast,
	Table,
	TableHeader,
	TableBody,
	TableHead,
	TableRow,
	TableCell,
} from "@base/ui";
import { Plus, Trash2, Layers, AlertCircle } from "lucide-react";
import {
	BOM_TYPES,
	QUANTITY_MODES,
	MATERIAL_ROLES,
	OUTPUT_ROLES,
	type BomType,
} from "../contract";
import type {
	BomDetailDto,
	BomFormOptions,
	CreateBomInput,
	UpdateBomInput,
} from "../types";

export interface BomEditorModalProps {
	readonly open: boolean;
	readonly onOpenChange: (open: boolean) => void;
	readonly editingBom: BomDetailDto | null;
	readonly formOptions: BomFormOptions;
	readonly onSubmit: (
		input: CreateBomInput | UpdateBomInput,
		isEdit: boolean,
		bomId?: string,
	) => Promise<{ success: boolean; error?: string }>;
}

export function BomEditorModal({
	open,
	onOpenChange,
	editingBom,
	formOptions,
	onSubmit,
}: BomEditorModalProps) {
	const isEdit = Boolean(editingBom);

	// 表单状态
	const [bomType, setBomType] = useState<BomType>(BOM_TYPES.PROCESSING);
	const [productId, setProductId] = useState<string>("");
	const [code, setCode] = useState<string>("");
	const [name, setName] = useState<string>("");
	const [productionLineId, setProductionLineId] = useState<string>("");
	const [description, setDescription] = useState<string>("");
	const [isRatioMode, setIsRatioMode] = useState<boolean>(false);
	const [totalYieldEnabled, setTotalYieldEnabled] = useState<boolean>(false);
	const [totalYieldRate, setTotalYieldRate] = useState<number>(100);
	const [isDefault, setIsDefault] = useState<boolean>(false);
	const [submitting, setSubmitting] = useState<boolean>(false);

	// 投入行
	const [inputs, setInputs] = useState<
		Array<{
			productId: string;
			quantity: number;
			unitId: string;
			ratio: number;
			materialRole: string;
			cookedYieldRate: number;
			normalLossRate: number;
		}>
	>([]);

	// 产出行 (主产品数量与单位)
	const [primaryQuantity, setPrimaryQuantity] = useState<number>(1);
	const [primaryUnitId, setPrimaryUnitId] = useState<string>("");

	// 工序行
	const [operations, setOperations] = useState<
		Array<{
			operationId: string;
			sequenceNumber: number;
			standardLaborHours: number;
			qualityCheckpoint: boolean;
			instructionText: string;
		}>
	>([]);

	// 监听 editingBom 或新增状态初始化
	useEffect(() => {
		if (editingBom) {
			const v = editingBom.currentVersion;
			setBomType(v.bomType);
			setProductId(editingBom.primaryProduct.id);
			setCode(v.code);
			setName(v.name);
			setProductionLineId(v.productionLineId || "");
			setDescription(v.description || "");
			setIsRatioMode(v.quantityMode === QUANTITY_MODES.RATIO);
			setTotalYieldEnabled(v.totalYieldEnabled);
			setTotalYieldRate(v.totalYieldRate ? Number(v.totalYieldRate) * 100 : 100);
			setIsDefault(editingBom.isDefault);

			// 产出数量
			const primaryOut = v.outputs.find((o) => o.outputRole === OUTPUT_ROLES.PRIMARY);
			if (primaryOut) {
				setPrimaryQuantity(Number(primaryOut.quantity));
				setPrimaryUnitId(primaryOut.unitId);
			}

			// 投入清单
			setInputs(
				v.inputs.map((i) => ({
					productId: i.productId,
					quantity: Number(i.quantity ?? 1),
					unitId: i.unitId,
					ratio: Number(i.ratio ?? 0) * 100,
					materialRole: i.materialRole,
					cookedYieldRate: Number(i.cookedYieldRate ?? 1) * 100,
					normalLossRate: Number(i.normalLossRate ?? 0) * 100,
				})),
			);

			// 工序清单
			setOperations(
				v.operations.map((op) => ({
					operationId: op.operationId,
					sequenceNumber: op.sequenceNumber,
					standardLaborHours: Number(op.standardLaborHours ?? 0),
					qualityCheckpoint: op.qualityCheckpoint,
					instructionText: op.instructionText || "",
				})),
			);
		} else {
			// 新增初始化
			setBomType(BOM_TYPES.PROCESSING);
			setProductId("");
			setCode(`BOM${Date.now().toString().slice(-6)}`);
			setName("");
			setProductionLineId("");
			setDescription("");
			setIsRatioMode(false);
			setTotalYieldEnabled(false);
			setTotalYieldRate(100);
			setIsDefault(false);
			setPrimaryQuantity(1);
			setPrimaryUnitId("");
			setInputs([
				{
					productId: "",
					quantity: 1,
					unitId: "",
					ratio: 100,
					materialRole: MATERIAL_ROLES.MAIN,
					cookedYieldRate: 100,
					normalLossRate: 0,
				},
			]);
			setOperations([]);
		}
	}, [editingBom, open]);

	// 当选择 BOM 主商品时，自动带出商品单位与建议 BOM 名称
	const handleSelectProduct = useCallback(
		(pId: string) => {
			setProductId(pId);
			const prod = formOptions.products.find((p) => p.id === pId);
			if (prod) {
				if (!name) setName(`${prod.name} 生产BOM`);
				setPrimaryUnitId(prod.inventoryUnitId);
			}
		},
		[formOptions.products, name],
	);

	// 添加原料投入行
	const handleAddInput = useCallback(() => {
		setInputs((prev) => [
			...prev,
			{
				productId: "",
				quantity: 1,
				unitId: formOptions.units[0]?.id || "",
				ratio: 0,
				materialRole: MATERIAL_ROLES.MAIN,
				cookedYieldRate: 100,
				normalLossRate: 0,
			},
		]);
	}, [formOptions.units]);

	// 移除投入行
	const handleRemoveInput = useCallback((idx: number) => {
		setInputs((prev) => prev.filter((_, i) => i !== idx));
	}, []);

	// 更新投入行字段
	const handleUpdateInput = useCallback(
		(idx: number, field: string, value: unknown) => {
			setInputs((prev) => {
				const next = [...prev];
				next[idx] = { ...next[idx], [field]: value };
				// 若选择了物料，自动带出该物料库存单位
				if (field === "productId") {
					const found = formOptions.products.find((p) => p.id === value);
					if (found) {
						next[idx].unitId = found.inventoryUnitId;
					}
				}
				return next;
			});
		},
		[formOptions.products],
	);

	// 添加工序行
	const handleAddOperation = useCallback(() => {
		setOperations((prev) => [
			...prev,
			{
				operationId: formOptions.operations[0]?.id || "",
				sequenceNumber: (prev.length + 1) * 10,
				standardLaborHours: 0.5,
				qualityCheckpoint: false,
				instructionText: "",
			},
		]);
	}, [formOptions.operations]);

	// 移除工序行
	const handleRemoveOperation = useCallback((idx: number) => {
		setOperations((prev) => prev.filter((_, i) => i !== idx));
	}, []);

	// 更新工序行
	const handleUpdateOperation = useCallback(
		(idx: number, field: string, value: unknown) => {
			setOperations((prev) => {
				const next = [...prev];
				next[idx] = { ...next[idx], [field]: value };
				return next;
			});
		},
		[],
	);

	// 提交保存
	const handleSubmit = async () => {
		if (!productId) {
			toast.error("请选择 BOM 主产出商品");
			return;
		}
		if (!code.trim()) {
			toast.error("请输入 BOM 编码");
			return;
		}
		if (!name.trim()) {
			toast.error("请输入 BOM 名称");
			return;
		}
		if (inputs.length === 0 || inputs.some((i) => !i.productId)) {
			toast.error("投入清单不能为空，且必须为每一行选择物料商品");
			return;
		}

		setSubmitting(true);
		try {
			const payload: CreateBomInput = {
				bomType,
				code: code.trim(),
				name: name.trim(),
				productId,
				productionLineId: productionLineId || null,
				description: description.trim() || null,
				quantityMode: isRatioMode ? QUANTITY_MODES.RATIO : QUANTITY_MODES.FIXED,
				totalYieldEnabled,
				totalYieldRate: totalYieldEnabled ? totalYieldRate / 100 : null,
				isDefault,
				outputs: [
					{
						productId,
						quantity: Number(primaryQuantity || 1),
						unitId: primaryUnitId || formOptions.units[0]?.id || "",
						outputRole: OUTPUT_ROLES.PRIMARY,
						sortOrder: 0,
					},
				],
				inputs: inputs.map((inp, idx) => ({
					productId: inp.productId,
					quantity: isRatioMode ? null : Number(inp.quantity),
					unitId: inp.unitId,
					ratio: isRatioMode ? Number(inp.ratio) / 100 : null,
					materialRole: inp.materialRole as any,
					cookedYieldRate: Number(inp.cookedYieldRate) / 100,
					normalLossRate: Number(inp.normalLossRate) / 100,
					sortOrder: idx,
				})),
				operations: operations.map((op, idx) => ({
					operationId: op.operationId,
					sequenceNumber: Number(op.sequenceNumber),
					standardLaborHours: Number(op.standardLaborHours),
					qualityCheckpoint: op.qualityCheckpoint,
					instructionText: op.instructionText || null,
					sortOrder: idx,
				})),
			};

			const res = await onSubmit(payload, isEdit, editingBom?.id);
			if (res.success) {
				toast.success(isEdit ? "BOM 版本已成功更新" : "生产 BOM 创建成功");
				onOpenChange(false);
			} else {
				toast.error(res.error || "保存失败");
			}
		} catch (err: unknown) {
			toast.error(err instanceof Error ? err.message : "提交异常");
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto p-6">
				<DialogHeader className="border-b pb-3">
					<DialogTitle className="text-lg font-bold flex items-center gap-2">
						<Layers className="size-5 text-blue-600" />
						{isEdit ? `编辑生产 BOM: ${editingBom?.currentVersion.name}` : "新建生产 BOM"}
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-6 py-4">
					{/* 1. 顶部类型选择 (仅新建时可选，编辑锁定) */}
					{!isEdit && (
						<div className="flex bg-muted/40 p-1.5 rounded-lg border w-fit">
							<button
								type="button"
								onClick={() => setBomType(BOM_TYPES.PROCESSING)}
								className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
									bomType === BOM_TYPES.PROCESSING
										? "bg-white dark:bg-slate-800 text-blue-600 shadow-sm"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								单品BOM
							</button>
							<button
								type="button"
								onClick={() => setBomType(BOM_TYPES.FORMULA)}
								className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
									bomType === BOM_TYPES.FORMULA
										? "bg-white dark:bg-slate-800 text-blue-600 shadow-sm"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								组合BOM
							</button>
							<button
								type="button"
								onClick={() => setBomType(BOM_TYPES.PACKAGING)}
								className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
									bomType === BOM_TYPES.PACKAGING
										? "bg-white dark:bg-slate-800 text-blue-600 shadow-sm"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								包装BOM
							</button>
						</div>
					)}

					{/* 2. 基本信息区域 */}
					<div>
						<h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-1.5">
							基本信息
						</h3>
						<div className="grid grid-cols-2 gap-4 text-xs">
							{/* BOM 商品 */}
							<div>
								<label className="block font-medium mb-1.5">
									<span className="text-destructive">*</span> BOM商品:
								</label>
								{isEdit ? (
									<div className="h-9 px-3 bg-muted/50 rounded-md border flex items-center font-medium">
										{editingBom?.primaryProduct.name} ({editingBom?.primaryProduct.code})
									</div>
								) : (
									<Combobox
										value={productId}
										placeholder="请选择目标商品..."
										options={formOptions.products.map((p) => ({
											value: p.id,
											label: `${p.name} (${p.code})`,
										}))}
										onChange={handleSelectProduct}
									/>
								)}
							</div>

							{/* 生产产线 */}
							<div>
								<label className="block font-medium mb-1.5">生产产线:</label>
								<Select value={productionLineId} onValueChange={(val) => setProductionLineId(val || "")}>
									<SelectTrigger className="h-9 text-xs">
										<SelectValue placeholder="请选择产线 (选填)" />
									</SelectTrigger>
									<SelectContent>
										{formOptions.productionLines.map((l) => (
											<SelectItem key={l.id} value={l.id}>
												{l.name} ({l.code})
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							{/* BOM 名称 */}
							<div>
								<label className="block font-medium mb-1.5">
									<span className="text-destructive">*</span> BOM名称:
								</label>
								<Input
									value={name}
									onChange={(e) => setName(e.target.value)}
									placeholder="如：青椒段5cm切配BOM"
									className="h-9 text-xs"
								/>
							</div>

							{/* BOM 编码 */}
							<div>
								<label className="block font-medium mb-1.5">
									<span className="text-destructive">*</span> BOM编码:
								</label>
								<Input
									value={code}
									onChange={(e) => setCode(e.target.value)}
									placeholder="如：BOM260901"
									className="h-9 text-xs font-mono"
								/>
							</div>

							{/* 描述说明 */}
							<div className="col-span-2">
								<label className="block font-medium mb-1.5">版本描述 / 工艺说明:</label>
								<Textarea
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									placeholder="输入该生产方案的具体说明与注意事项..."
									rows={2}
									className="text-xs"
								/>
							</div>
						</div>
					</div>

					{/* 3. 生产配比信息 (投入与产出) */}
					<div>
						<div className="flex items-center justify-between mb-3">
							<h3 className="text-sm font-bold text-foreground">
								生产信息
							</h3>
							{bomType !== BOM_TYPES.PROCESSING && (
								<div className="flex items-center gap-2 text-xs">
									<span>BOM占比设置:</span>
									<Switch
										checked={isRatioMode}
										onCheckedChange={setIsRatioMode}
									/>
									<span className="text-muted-foreground text-[11px]">
										{isRatioMode ? "(按配方占比%投入)" : "(按固定数量投入)"}
									</span>
								</div>
							)}
						</div>

						{/* 原料投入表格 */}
						<div className="rounded-lg border overflow-hidden mb-4">
							<div className="bg-muted/40 px-3 py-2 border-b flex items-center justify-between text-xs font-semibold">
								<span>原料投入清单</span>
								{bomType !== BOM_TYPES.PROCESSING && (
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={handleAddInput}
										className="h-6 px-2 text-xs gap-1"
									>
										<Plus className="size-3" /> 添加原料
									</Button>
								)}
							</div>
							<Table className="w-full text-xs">
								<TableHeader className="bg-muted/20 border-b">
									<TableRow>
										<TableHead className="py-2 px-3 text-left w-56 font-medium">投入物料商品</TableHead>
										<TableHead className="py-2 px-3 text-left w-28 font-medium">
											{isRatioMode ? "配方占比(%)" : "标准毛投入"}
										</TableHead>
										<TableHead className="py-2 px-3 text-left w-28 font-medium">投入单位</TableHead>
										<TableHead className="py-2 px-3 text-left w-24 font-medium">物料角色</TableHead>
										<TableHead className="py-2 px-3 text-left w-24 font-medium">熟出成率(%)</TableHead>
										{bomType !== BOM_TYPES.PROCESSING && (
											<TableHead className="py-2 px-2 text-center w-12">操作</TableHead>
										)}
									</TableRow>
								</TableHeader>
								<TableBody className="divide-y">
									{inputs.map((inp, idx) => (
										<TableRow key={idx}>
											<TableCell className="p-2">
												<Combobox
													value={inp.productId}
													placeholder="选择物料..."
													options={formOptions.products.map((p) => ({
														value: p.id,
														label: `${p.name} (${p.code})`,
													}))}
													onChange={(val) => handleUpdateInput(idx, "productId", val)}
												/>
											</TableCell>
											<TableCell className="p-2">
												<Input
													type="number"
													step="0.01"
													value={isRatioMode ? inp.ratio : inp.quantity}
													onChange={(e) =>
														handleUpdateInput(
															idx,
															isRatioMode ? "ratio" : "quantity",
															e.target.value,
														)
													}
													className="h-8 text-xs font-mono"
												/>
											</TableCell>
											<TableCell className="p-2">
												<Select
													value={inp.unitId}
													onValueChange={(val) => handleUpdateInput(idx, "unitId", val || "")}
												>
													<SelectTrigger className="h-8 text-xs">
														<SelectValue placeholder="单位" />
													</SelectTrigger>
													<SelectContent>
														{formOptions.units.map((u) => (
															<SelectItem key={u.id} value={u.id}>
																{u.name || u.code}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</TableCell>
											<TableCell className="p-2">
												<Select
													value={inp.materialRole}
													onValueChange={(val) =>
														handleUpdateInput(idx, "materialRole", val || "")
													}
												>
													<SelectTrigger className="h-8 text-xs">
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value={MATERIAL_ROLES.MAIN}>主料</SelectItem>
														<SelectItem value={MATERIAL_ROLES.AUXILIARY}>辅料</SelectItem>
														<SelectItem value={MATERIAL_ROLES.PACKAGING}>包材</SelectItem>
													</SelectContent>
												</Select>
											</TableCell>
											<TableCell className="p-2">
												<Input
													type="number"
													value={inp.cookedYieldRate}
													onChange={(e) =>
														handleUpdateInput(idx, "cookedYieldRate", e.target.value)
													}
													className="h-8 text-xs font-mono"
												/>
											</TableCell>
											{bomType !== BOM_TYPES.PROCESSING && (
												<TableCell className="p-2 text-center">
													<Button
														type="button"
														variant="ghost"
														size="icon"
														onClick={() => handleRemoveInput(idx)}
														className="size-7 text-destructive hover:bg-destructive/10"
													>
														<Trash2 className="size-3.5" />
													</Button>
												</TableCell>
											)}
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>

						{/* 成品主产出设置 */}
						<div className="rounded-lg border p-3 bg-muted/20 flex items-center justify-between text-xs mb-4">
							<div className="flex items-center gap-2">
								<span className="font-semibold text-foreground">标准批次主产出:</span>
								<span className="text-muted-foreground">
									{formOptions.products.find((p) => p.id === productId)?.name || "待选商品"}
								</span>
							</div>
							<div className="flex items-center gap-2">
								<span>产出数量:</span>
								<Input
									type="number"
									step="0.01"
									value={primaryQuantity}
									onChange={(e) => setPrimaryQuantity(Number(e.target.value))}
									className="h-8 w-24 text-xs font-mono"
								/>
								<Select value={primaryUnitId} onValueChange={(val) => setPrimaryUnitId(val || "")}>
									<SelectTrigger className="h-8 w-24 text-xs">
										<SelectValue placeholder="单位" />
									</SelectTrigger>
									<SelectContent>
										{formOptions.units.map((u) => (
											<SelectItem key={u.id} value={u.id}>
												{u.name || u.code}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>

						{/* 总出成率控制 */}
						<div className="flex items-center justify-between bg-muted/40 p-3 rounded-lg border text-xs mb-4">
							<div className="flex items-center gap-2">
								<Switch
									checked={totalYieldEnabled}
									onCheckedChange={setTotalYieldEnabled}
								/>
								<span className="font-semibold">启用总出成率控制</span>
								<span className="text-muted-foreground text-[11px]">
									(开启总出成率后，以总出成率为最终试算折算准则)
								</span>
							</div>
							{totalYieldEnabled && (
								<div className="flex items-center gap-1.5 font-mono">
									<span>设定出成率:</span>
									<Input
										type="number"
										value={totalYieldRate}
										onChange={(e) => setTotalYieldRate(Number(e.target.value))}
										className="h-8 w-20 text-xs font-bold text-emerald-600"
									/>
									<span>%</span>
								</div>
							)}
						</div>

						{/* BOM 工序清单表格 */}
						<div className="rounded-lg border overflow-hidden">
							<div className="bg-muted/40 px-3 py-2 border-b flex items-center justify-between text-xs font-semibold">
								<span>BOM 工序工艺路线</span>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={handleAddOperation}
									className="h-6 px-2 text-xs gap-1"
								>
									<Plus className="size-3" /> 添加工序
								</Button>
							</div>
							<Table className="w-full text-xs">
								<TableHeader className="bg-muted/20 border-b">
									<TableRow>
										<TableHead className="py-2 px-3 text-left w-16 font-medium">顺序</TableHead>
										<TableHead className="py-2 px-3 text-left w-48 font-medium">工序名称</TableHead>
										<TableHead className="py-2 px-3 text-left w-24 font-medium">标准工时(h)</TableHead>
										<TableHead className="py-2 px-3 text-center w-20 font-medium">质检控制</TableHead>
										<TableHead className="py-2 px-3 text-left font-medium">操作指引说明</TableHead>
										<TableHead className="py-2 px-2 text-center w-12">操作</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody className="divide-y">
									{operations.map((op, idx) => (
										<TableRow key={idx}>
											<TableCell className="p-2">
												<Input
													type="number"
													value={op.sequenceNumber}
													onChange={(e) =>
														handleUpdateOperation(idx, "sequenceNumber", Number(e.target.value))
													}
													className="h-8 text-xs font-mono"
												/>
											</TableCell>
											<TableCell className="p-2">
												<Select
													value={op.operationId}
													onValueChange={(val) => handleUpdateOperation(idx, "operationId", val || "")}
												>
													<SelectTrigger className="h-8 text-xs">
														<SelectValue placeholder="选择工序" />
													</SelectTrigger>
													<SelectContent>
														{formOptions.operations.map((o) => (
															<SelectItem key={o.id} value={o.id}>
																{o.name} ({o.code})
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</TableCell>
											<TableCell className="p-2">
												<Input
													type="number"
													step="0.1"
													value={op.standardLaborHours}
													onChange={(e) =>
														handleUpdateOperation(idx, "standardLaborHours", Number(e.target.value))
													}
													className="h-8 text-xs font-mono"
												/>
											</TableCell>
											<TableCell className="p-2 text-center">
												<Switch
													checked={op.qualityCheckpoint}
													onCheckedChange={(val) =>
														handleUpdateOperation(idx, "qualityCheckpoint", val)
													}
												/>
											</TableCell>
											<TableCell className="p-2">
												<Input
													value={op.instructionText}
													onChange={(e) =>
														handleUpdateOperation(idx, "instructionText", e.target.value)
													}
													placeholder="操作规范指引..."
													className="h-8 text-xs"
												/>
											</TableCell>
											<TableCell className="p-2 text-center">
												<Button
													type="button"
													variant="ghost"
													size="icon"
													onClick={() => handleRemoveOperation(idx)}
													className="size-7 text-destructive hover:bg-destructive/10"
												>
													<Trash2 className="size-3.5" />
												</Button>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					</div>

					{/* 4. 其他信息 (是否默认 BOM) */}
					<div className="bg-muted/40 p-3 rounded-lg border flex items-center justify-between text-xs">
						<div>
							<div className="font-semibold text-foreground">设为商品默认 BOM 方案</div>
							<div className="text-muted-foreground text-[11px]">
								启用后，在排产、配方展开与物料试算时将默认采用该套 BOM 定义
							</div>
						</div>
						<Switch checked={isDefault} onCheckedChange={setIsDefault} />
					</div>
				</div>

				<DialogFooter className="border-t pt-3">
					<Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
						取消
					</Button>
					<Button size="sm" onClick={handleSubmit} disabled={submitting}>
						{submitting ? "正在保存..." : "确认保存"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
