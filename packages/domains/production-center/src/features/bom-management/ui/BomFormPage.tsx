"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
	Button,
	Badge,
	Input,
	Textarea,
	Switch,
	Combobox,
	Table,
	TableHeader,
	TableBody,
	TableHead,
	TableRow,
	TableCell,
	useSafeRouter,
	updateTabTitle,
	toast,
	ConfirmDialog,
	type FormPageMode,
} from "@base/ui";
import {
	Layers,
	ArrowLeft,
	Save,
	Plus,
	Trash2,
	Edit,
	CheckCircle2,
	Check,
	Box,
	Clock,
} from "lucide-react";
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
import { createBomAction, updateBomAction } from "../actions";

export interface BomFormPageProps {
	readonly mode?: FormPageMode;
	readonly bomId?: string;
	readonly initialDetail?: BomDetailDto | null;
	readonly formOptions: BomFormOptions;
	readonly backUrl?: string;
}

export function BomFormPage({
	mode = "create",
	bomId,
	initialDetail,
	formOptions,
	backUrl = "/production/bom",
}: BomFormPageProps) {
	const router = useSafeRouter();
	const isView = mode === "view";
	const isEdit = mode === "edit";

	const [submitting, setSubmitting] = useState<boolean>(false);

	// 表单状态
	const [bomType, setBomType] = useState<BomType>(
		initialDetail?.currentVersion.bomType || BOM_TYPES.PROCESSING,
	);
	const [productId, setProductId] = useState<string>(
		initialDetail?.primaryProduct.id || "",
	);
	const [code, setCode] = useState<string>(
		initialDetail?.currentVersion.code || `BOM${Date.now().toString().slice(-6)}`,
	);
	const [name, setName] = useState<string>(
		initialDetail?.currentVersion.name || "",
	);
	const [productionLineId, setProductionLineId] = useState<string>(
		initialDetail?.currentVersion.productionLineId || "",
	);
	const [description, setDescription] = useState<string>(
		initialDetail?.currentVersion.description || "",
	);
	const [isRatioMode, setIsRatioMode] = useState<boolean>(
		initialDetail?.currentVersion.quantityMode === QUANTITY_MODES.RATIO,
	);
	const [totalYieldEnabled, setTotalYieldEnabled] = useState<boolean>(
		initialDetail?.currentVersion.totalYieldEnabled || false,
	);
	const [totalYieldRate, setTotalYieldRate] = useState<number>(
		initialDetail?.currentVersion.totalYieldRate
			? Number(initialDetail.currentVersion.totalYieldRate) * 100
			: 100,
	);
	const [isDefault, setIsDefault] = useState<boolean>(
		initialDetail?.isDefault || false,
	);

	// 成品主产出
	const [primaryQuantity, setPrimaryQuantity] = useState<number>(
		Number(initialDetail?.currentVersion.outputs.find((o) => o.outputRole === OUTPUT_ROLES.PRIMARY)?.quantity ?? 1),
	);
	const [primaryUnitId, setPrimaryUnitId] = useState<string>(
		initialDetail?.currentVersion.outputs.find((o) => o.outputRole === OUTPUT_ROLES.PRIMARY)?.unitId || "",
	);

	// 动态同步 TabBar 页签标题
	useEffect(() => {
		const tabTitle =
			mode === "create"
				? "新建生产BOM"
				: mode === "edit"
					? `编辑: ${name || initialDetail?.currentVersion.name || "生产BOM"}`
					: `BOM: ${name || initialDetail?.currentVersion.name || "详情"}`;
		updateTabTitle(tabTitle);
	}, [mode, name, initialDetail]);

	// 投入物料清单
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
	>(() => {
		if (initialDetail?.currentVersion.inputs && initialDetail.currentVersion.inputs.length > 0) {
			return initialDetail.currentVersion.inputs.map((inp) => ({
				productId: inp.productId,
				quantity: Number(inp.quantity ?? 1),
				unitId: inp.unitId,
				ratio: Number(inp.ratio ?? 0) * 100,
				materialRole: inp.materialRole,
				cookedYieldRate: Number(inp.cookedYieldRate ?? 1) * 100,
				normalLossRate: Number(inp.normalLossRate ?? 0) * 100,
			}));
		}
		return [
			{
				productId: "",
				quantity: 1,
				unitId: formOptions.units[0]?.id || "",
				ratio: 100,
				materialRole: MATERIAL_ROLES.MAIN,
				cookedYieldRate: 100,
				normalLossRate: 0,
			},
		];
	});

	// 工艺工序清单
	const [operations, setOperations] = useState<
		Array<{
			operationId: string;
			sequenceNumber: number;
			standardLaborHours: number;
			qualityCheckpoint: boolean;
			instructionText: string;
		}>
	>(() => {
		if (initialDetail?.currentVersion.operations && initialDetail.currentVersion.operations.length > 0) {
			return initialDetail.currentVersion.operations.map((op) => ({
				operationId: op.operationId,
				sequenceNumber: op.sequenceNumber,
				standardLaborHours: Number(op.standardLaborHours ?? 0),
				qualityCheckpoint: op.qualityCheckpoint,
				instructionText: op.instructionText || "",
			}));
		}
		return [];
	});

	// 选择 BOM 商品
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

	// 添加投入行
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

	// 更新投入行
	const handleUpdateInput = useCallback(
		(idx: number, field: string, value: unknown) => {
			setInputs((prev) => {
				const next = [...prev];
				next[idx] = { ...next[idx], [field]: value };
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

	// 保存提交 (支持保存草稿或发布生效)
	const handleSave = async (isDraftAction: boolean = false) => {
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
				isDraft: isDraftAction,
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

			if (isEdit && bomId) {
				const res = await updateBomAction(bomId, payload as UpdateBomInput);
				if (res.success) {
					toast.success(isDraftAction ? "BOM 草稿已成功保存" : "BOM 新版本已发布生效");
					router?.refresh();
					router?.push(backUrl);
				} else {
					toast.error(res.error || "保存失败");
				}
			} else {
				const res = await createBomAction(payload);
				if (res.success) {
					toast.success(isDraftAction ? "BOM 草稿已保存" : "生产 BOM 已发布生效");
					router?.refresh();
					router?.push(backUrl);
				} else {
					toast.error(res.error || "操作失败");
				}
			}
		} catch (err: unknown) {
			toast.error(err instanceof Error ? err.message : "保存异常");
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="flex flex-col min-h-[calc(100vh-4rem)] bg-background">
			{/* 1. 顶部单据操作栏 (紧凑单行高密设计，去除多余副标题) */}
			<div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b px-6 py-2.5 flex items-center justify-between">
				<div className="flex items-center gap-3">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => router?.push(backUrl)}
						className="gap-1 text-xs text-muted-foreground hover:text-foreground h-8 px-2.5"
					>
						<ArrowLeft className="size-3.5" /> 返回
					</Button>
					<div className="h-4 w-px bg-border" />
					<div className="flex items-center gap-2">
						<span className="text-sm font-bold text-foreground">
							{isView
								? `BOM 方案详情: ${name || initialDetail?.primaryProduct.name}`
								: isEdit
									? `编辑生产 BOM: ${name || initialDetail?.currentVersion.name}`
									: "新建生产 BOM"}
						</span>
						{isDefault && (
							<Badge variant="default" size="sm" className="bg-blue-600 hover:bg-blue-600 text-[10px] py-0 h-4 px-1.5">
								默认BOM
							</Badge>
						)}
						<Badge variant="outline" size="sm" className="text-[10px] py-0 h-4 px-1.5">
							{bomType === "PROCESSING" ? "单品加工" : bomType === "FORMULA" ? "组合配方" : "包装装配"}
						</Badge>
					</div>
				</div>

				{/* 顶栏右侧操作动作 */}
				<div className="flex items-center gap-2.5">
					{isView ? (
						<Button
							size="sm"
							onClick={() => router?.push(`/production/bom/${bomId}?mode=edit`)}
							className="h-8 text-xs gap-1.5"
						>
							<Edit className="size-3.5" /> 编辑方案
						</Button>
					) : (
						<>
							<Button
								variant="outline"
								size="sm"
								onClick={() => router?.push(backUrl)}
								disabled={submitting}
								className="h-8 text-xs"
							>
								取消
							</Button>
							<Button
								variant="secondary"
								size="sm"
								onClick={() => handleSave(true)}
								disabled={submitting}
								className="h-8 text-xs gap-1.5 min-w-[80px]"
							>
								<Save className="size-3.5 text-muted-foreground" />
								{submitting ? "保存中..." : "保存草稿"}
							</Button>
							<ConfirmDialog
								trigger={
									<Button
										size="sm"
										disabled={submitting}
										className="h-8 text-xs gap-1.5 min-w-[88px] bg-blue-600 hover:bg-blue-700 text-white"
									>
										<Check className="size-3.5" />
										{submitting ? "处理中..." : isEdit ? "发布新版本" : "立即发布"}
									</Button>
								}
								title={isEdit ? "确认发布生产 BOM 新版本？" : "确认立即发布生产 BOM 方案？"}
								description={
									isEdit
										? "编辑发布生产BOM后只影响后续未生成的生产计划与工单，历史及已生成的计划不受影响。"
										: "发布后该方案将作为生效标准，供后续创建生产计划与工单时引用。"
								}
								confirmText="确认发布"
								cancelText="返回修改"
								onConfirm={() => handleSave(false)}
							/>
						</>
					)}
				</div>
			</div>

			{/* 2. 主表单内容区域 (居中大卡片、多区块分栏排版) */}
			<div className="flex-1 max-w-6xl w-full mx-auto p-8 space-y-8 pb-24">
				{/* 类型切换 (新建态特有) */}
				{!isEdit && !isView && (
					<div className="flex items-center gap-3 bg-muted/40 p-2 rounded-xl border w-fit">
						<span className="text-xs font-semibold text-muted-foreground px-2">BOM 类型:</span>
						<button
							type="button"
							onClick={() => setBomType(BOM_TYPES.PROCESSING)}
							className={`px-5 py-2 text-xs font-bold rounded-lg transition-all ${
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
							className={`px-5 py-2 text-xs font-bold rounded-lg transition-all ${
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
							className={`px-5 py-2 text-xs font-bold rounded-lg transition-all ${
								bomType === BOM_TYPES.PACKAGING
									? "bg-white dark:bg-slate-800 text-blue-600 shadow-sm"
									: "text-muted-foreground hover:text-foreground"
							}`}
						>
							包装BOM
						</button>
					</div>
				)}

				{/* 区块 1：基本信息 */}
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
						<div>
							<label className="block font-semibold mb-2">
								<span className="text-destructive">*</span> BOM主产出商品:
							</label>
							{isView || isEdit ? (
								<div className="h-10 px-3.5 bg-muted/40 rounded-md border flex items-center font-medium text-foreground">
									{initialDetail?.primaryProduct.name} ({initialDetail?.primaryProduct.code})
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
						</div>

						{/* 生产产线 */}
						<div>
							<label className="block font-semibold mb-2">生产产线:</label>
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
						</div>

						{/* BOM 名称 */}
						<div>
							<label className="block font-semibold mb-2">
								<span className="text-destructive">*</span> BOM名称:
							</label>
							<Input
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="如：青椒段5cm标准切配BOM"
								disabled={isView}
								className="h-10 text-xs"
							/>
						</div>

						{/* BOM 编码 */}
						<div>
							<label className="block font-semibold mb-2">
								<span className="text-destructive">*</span> BOM编码:
							</label>
							<Input
								value={code}
								onChange={(e) => setCode(e.target.value)}
								placeholder="如：BOM260901"
								disabled={isView}
								className="h-10 text-xs font-mono"
							/>
						</div>

						{/* 描述 */}
						<div className="col-span-2">
							<label className="block font-semibold mb-2">方案描述 / 工艺说明:</label>
							<Textarea
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder="输入该生产方案的具体说明与配方备注..."
								disabled={isView}
								rows={3}
								className="text-xs"
							/>
						</div>
					</div>
				</div>

				{/* 区块 2：生产物料配比与清单 */}
				<div className="bg-card rounded-xl border shadow-sm p-6 space-y-6">
					<div className="border-b pb-3 flex items-center justify-between">
						<div>
							<h2 className="text-base font-bold text-foreground flex items-center gap-2">
								<Box className="size-4 text-blue-600" /> 原料投入与配比清单
							</h2>
							<p className="text-xs text-muted-foreground mt-0.5">
								配置生产所需的原材料毛投入量、配方占比与物料角色
							</p>
						</div>
						{bomType !== BOM_TYPES.PROCESSING && !isView && (
							<div className="flex items-center gap-3 text-xs bg-muted/40 px-3 py-1.5 rounded-lg border">
								<span className="font-semibold">BOM占比模式:</span>
								<Switch checked={isRatioMode} onCheckedChange={setIsRatioMode} />
								<span className="text-muted-foreground">
									{isRatioMode ? "配方占比(%)" : "固定数量"}
								</span>
							</div>
						)}
					</div>

					{/* 原料投入明细表 */}
					<div className="rounded-xl border overflow-hidden">
						<div className="bg-muted/40 px-4 py-3 border-b flex items-center justify-between">
							<span className="text-xs font-bold text-foreground">原料投入行</span>
							{bomType !== BOM_TYPES.PROCESSING && !isView && (
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={handleAddInput}
									className="h-7 text-xs gap-1"
								>
									<Plus className="size-3.5" /> 添加原料行
								</Button>
							)}
						</div>
						<Table className="w-full text-xs">
							<TableHeader className="bg-muted/20">
								<TableRow>
									<TableHead className="py-3 px-4 font-semibold w-72">投入物料商品</TableHead>
									<TableHead className="py-3 px-4 font-semibold w-36">
										{isRatioMode ? "配方占比(%)" : "标准毛投入"}
									</TableHead>
									<TableHead className="py-3 px-4 font-semibold w-36">投入单位</TableHead>
									<TableHead className="py-3 px-4 font-semibold w-32">物料角色</TableHead>
									<TableHead className="py-3 px-4 font-semibold w-32">熟出成率(%)</TableHead>
									{!isView && bomType !== BOM_TYPES.PROCESSING && (
										<TableHead className="py-3 px-4 text-center w-16">操作</TableHead>
									)}
								</TableRow>
							</TableHeader>
							<TableBody className="divide-y">
								{inputs.map((inp, idx) => (
									<TableRow key={idx}>
										<TableCell className="p-3">
											{isView ? (
												<div className="font-medium">
													{formOptions.products.find((p) => p.id === inp.productId)?.name || inp.productId}
												</div>
											) : (
												<Combobox
													value={inp.productId}
													placeholder="选择物料..."
													options={formOptions.products.map((p) => ({
														value: p.id,
														label: `${p.name} (${p.code})`,
													}))}
													onChange={(val) => handleUpdateInput(idx, "productId", val)}
												/>
											)}
										</TableCell>
										<TableCell className="p-3">
											<Input
												type="number"
												step="0.01"
												value={isRatioMode ? inp.ratio : inp.quantity}
												disabled={isView}
												onChange={(e) =>
													handleUpdateInput(idx, isRatioMode ? "ratio" : "quantity", e.target.value)
												}
												className="h-9 text-xs font-mono"
											/>
										</TableCell>
										<TableCell className="p-3">
											{isView ? (
												<div className="font-medium text-xs">
													{formOptions.units.find((u) => u.id === inp.unitId)?.name || inp.unitId}
												</div>
											) : (
												<Combobox
													value={inp.unitId}
													placeholder="单位"
													options={formOptions.units.map((u) => ({
														value: u.id,
														label: u.name || u.code,
													}))}
													onChange={(val) => handleUpdateInput(idx, "unitId", val || "")}
												/>
											)}
										</TableCell>
										<TableCell className="p-3">
											{isView ? (
												<div className="font-medium text-xs">
													{inp.materialRole === MATERIAL_ROLES.MAIN
														? "主料"
														: inp.materialRole === MATERIAL_ROLES.AUXILIARY
															? "辅料"
															: "包材"}
												</div>
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
														handleUpdateInput(idx, "materialRole", val || MATERIAL_ROLES.MAIN)
													}
												/>
											)}
										</TableCell>
										<TableCell className="p-3">
											<Input
												type="number"
												value={inp.cookedYieldRate}
												disabled={isView}
												onChange={(e) => handleUpdateInput(idx, "cookedYieldRate", e.target.value)}
												className="h-9 text-xs font-mono"
											/>
										</TableCell>
										{!isView && bomType !== BOM_TYPES.PROCESSING && (
											<TableCell className="p-3 text-center">
												<Button
													type="button"
													variant="ghost"
													size="icon"
													onClick={() => handleRemoveInput(idx)}
													className="size-8 text-destructive hover:bg-destructive/10"
												>
													<Trash2 className="size-4" />
												</Button>
											</TableCell>
										)}
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>

					{/* 成品产出设置 */}
					<div className="rounded-xl border p-4 bg-muted/20 flex items-center justify-between text-xs">
						<div className="flex items-center gap-3">
							<CheckCircle2 className="size-4 text-blue-600" />
							<div>
								<div className="font-bold text-foreground">标准批次主产出成品</div>
								<div className="text-muted-foreground">
									{formOptions.products.find((p) => p.id === productId)?.name || "请在上文选择 BOM 商品"}
								</div>
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
									{formOptions.units.find((u) => u.id === primaryUnitId)?.name || primaryUnitId}
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

					{/* 总出成率折算 */}
					<div className="flex items-center justify-between bg-muted/40 p-4 rounded-xl border text-xs">
						<div className="flex items-center gap-3">
							<Switch
								checked={totalYieldEnabled}
								disabled={isView}
								onCheckedChange={setTotalYieldEnabled}
							/>
							<div>
								<span className="font-bold text-foreground">启用总出成率折算控制</span>
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
				</div>

				{/* 区块 3：工艺工序路线 */}
				<div className="bg-card rounded-xl border shadow-sm p-6 space-y-4">
					<div className="border-b pb-3 flex items-center justify-between">
						<div>
							<h2 className="text-base font-bold text-foreground flex items-center gap-2">
								<Clock className="size-4 text-blue-600" /> 工序工艺路线
							</h2>
							<p className="text-xs text-muted-foreground mt-0.5">
								定义物料从投入到产出所经过的有序加工步骤、标准工时与质检控制点
							</p>
						</div>
						{!isView && (
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={handleAddOperation}
								className="h-8 text-xs gap-1.5"
							>
								<Plus className="size-3.5" /> 添加加工工序
							</Button>
						)}
					</div>

					<div className="rounded-xl border overflow-hidden">
						<Table className="w-full text-xs">
							<TableHeader className="bg-muted/20">
								<TableRow>
									<TableHead className="py-3 px-4 w-20 font-semibold text-center">顺序</TableHead>
									<TableHead className="py-3 px-4 w-64 font-semibold">工序名称</TableHead>
									<TableHead className="py-3 px-4 w-32 font-semibold">标准工时(h)</TableHead>
									<TableHead className="py-3 px-4 w-28 text-center font-semibold">质检控制点</TableHead>
									<TableHead className="py-3 px-4 font-semibold">操作指引说明</TableHead>
									{!isView && <TableHead className="py-3 px-4 text-center w-16">操作</TableHead>}
								</TableRow>
							</TableHeader>
							<TableBody className="divide-y">
								{operations.length > 0 ? (
									operations.map((op, idx) => (
										<TableRow key={idx}>
											<TableCell className="p-3 text-center">
												<Input
													type="number"
													value={op.sequenceNumber}
													disabled={isView}
													onChange={(e) =>
														handleUpdateOperation(idx, "sequenceNumber", Number(e.target.value))
													}
													className="h-9 text-xs font-mono text-center"
												/>
											</TableCell>
											<TableCell className="p-3">
												{isView ? (
													<span className="font-semibold">
														{formOptions.operations.find((o) => o.id === op.operationId)?.name || op.operationId}
													</span>
												) : (
													<Combobox
														value={op.operationId}
														placeholder="选择工序..."
														options={formOptions.operations.map((o) => ({
															value: o.id,
															label: `${o.name} (${o.code})`,
														}))}
														onChange={(val) =>
															handleUpdateOperation(idx, "operationId", val || "")
														}
													/>
												)}
											</TableCell>
											<TableCell className="p-3">
												<Input
													type="number"
													step="0.1"
													value={op.standardLaborHours}
													disabled={isView}
													onChange={(e) =>
														handleUpdateOperation(idx, "standardLaborHours", Number(e.target.value))
													}
													className="h-9 text-xs font-mono"
												/>
											</TableCell>
											<TableCell className="p-3 text-center">
												<Switch
													checked={op.qualityCheckpoint}
													disabled={isView}
													onCheckedChange={(val) =>
														handleUpdateOperation(idx, "qualityCheckpoint", val)
													}
												/>
											</TableCell>
											<TableCell className="p-3">
												<Input
													value={op.instructionText}
													disabled={isView}
													onChange={(e) =>
														handleUpdateOperation(idx, "instructionText", e.target.value)
													}
													placeholder="操作规范与技术指引..."
													className="h-9 text-xs"
												/>
											</TableCell>
											{!isView && (
												<TableCell className="p-3 text-center">
													<Button
														type="button"
														variant="ghost"
														size="icon"
														onClick={() => handleRemoveOperation(idx)}
														className="size-8 text-destructive hover:bg-destructive/10"
													>
														<Trash2 className="size-4" />
													</Button>
												</TableCell>
											)}
										</TableRow>
									))
								) : (
									<TableRow>
										<TableCell colSpan={6} className="text-center py-6 text-muted-foreground italic">
											未配置工序工艺路线
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>
				</div>

				{/* 区块 4：客户默认方案设置 */}
				<div className="bg-card rounded-xl border shadow-sm p-6 flex items-center justify-between text-xs">
					<div>
						<div className="font-bold text-foreground text-sm">设为商品默认 BOM 生产方案</div>
						<div className="text-muted-foreground mt-0.5">
							开启后，在计划排产、配方多级展开与理论投料计算时，系统将默认采用本套 BOM 方案
						</div>
					</div>
					<Switch checked={isDefault} disabled={isView} onCheckedChange={setIsDefault} />
				</div>
			</div>
		</div>
	);
}
