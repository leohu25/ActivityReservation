"use client";

import React, { useState, useEffect } from "react";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetDescription,
	Badge,
	Button,
	Tabs,
	TabsList,
	TabsTrigger,
	TabsContent,
	Select,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectItem,
	Table,
	TableHeader,
	TableBody,
	TableHead,
	TableRow,
	TableCell,
} from "@base/ui";
import {
	Layers,
	ArrowRight,
	Box,
	CheckCircle2,
	Clock,
	FileText,
	GitBranch,
} from "lucide-react";
import type { BomDetailDto } from "../types";
import type { BomType } from "../contract";

export interface BomDetailDrawerProps {
	readonly open: boolean;
	readonly onOpenChange: (open: boolean) => void;
	readonly detail: BomDetailDto | null;
	readonly onEdit?: (detail: BomDetailDto) => void;
	readonly onSelectVersion?: (versionNumber: number) => void;
}

const BOM_TYPE_BADGES: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
	PROCESSING: { label: "单品加工", variant: "default" },
	FORMULA: { label: "组合配方", variant: "secondary" },
	PACKAGING: { label: "包装装配", variant: "outline" },
};

export function BomDetailDrawer({
	open,
	onOpenChange,
	detail,
	onEdit,
	onSelectVersion,
}: BomDetailDrawerProps) {
	const [activeTab, setActiveTab] = useState<string>("graph");

	if (!detail) return null;

	const { currentVersion, primaryProduct, isDefault, versionHistory } = detail;
	const typeConfig = BOM_TYPE_BADGES[currentVersion.bomType] ?? {
		label: currentVersion.bomType,
		variant: "secondary",
	};

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="sm:max-w-3xl overflow-y-auto p-6">
				<SheetHeader className="pb-4 border-b">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<SheetTitle className="text-xl font-bold flex items-center gap-2">
								{primaryProduct.name}
								{isDefault && (
									<Badge variant="default" size="sm" className="bg-blue-600 hover:bg-blue-600">
										默认BOM
									</Badge>
								)}
								<Badge variant={typeConfig.variant} size="sm">
									{typeConfig.label}
								</Badge>
							</SheetTitle>
						</div>
						{onEdit && (
							<Button
								variant="outline"
								size="sm"
								onClick={() => onEdit(detail)}
								className="gap-1.5"
							>
								编辑方案
							</Button>
						)}
					</div>
					<SheetDescription className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mt-2">
						<span>BOM 编码: <strong className="font-mono text-foreground">{currentVersion.code}</strong></span>
						<span>方案名称: <strong className="text-foreground">{currentVersion.name}</strong></span>
						<span>生产产线: <strong className="text-foreground">{currentVersion.productionLineName || "未指定"}</strong></span>
						{currentVersion.totalYieldEnabled && (
							<span>总出成率: <strong className="text-emerald-600 font-semibold">{Number(currentVersion.totalYieldRate || 1) * 100}%</strong></span>
						)}
					</SheetDescription>
				</SheetHeader>

				{/* 版本切换栏 */}
				<div className="my-4 flex items-center justify-between bg-muted/40 p-3 rounded-lg border">
					<div className="flex items-center gap-2 text-sm font-medium">
						<GitBranch className="size-4 text-muted-foreground" />
						<span>当前版本:</span>
						<Select
							value={String(currentVersion.versionNumber)}
							onValueChange={(val) => onSelectVersion?.(Number(val))}
						>
							<SelectTrigger className="h-8 w-28 text-xs font-mono">
								<SelectValue placeholder={`版本 ${currentVersion.versionNumber}`} />
							</SelectTrigger>
							<SelectContent>
								{versionHistory.map((v) => (
									<SelectItem key={v.id} value={String(v.versionNumber)}>
										版本 {v.versionNumber} ({v.versionStatus === "PUBLISHED" ? "已发布" : "草稿"})
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<span className="text-xs text-muted-foreground">
						{currentVersion.description || "无版本描述"}
					</span>
				</div>

				<Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
					<TabsList className="grid grid-cols-4 w-full">
						<TabsTrigger value="graph" className="text-xs">
							版本流程图谱
						</TabsTrigger>
						<TabsTrigger value="inputs" className="text-xs">
							投入清单 ({currentVersion.inputs.length})
						</TabsTrigger>
						<TabsTrigger value="outputs" className="text-xs">
							产出清单 ({currentVersion.outputs.length})
						</TabsTrigger>
						<TabsTrigger value="operations" className="text-xs">
							工艺路线 ({currentVersion.operations.length})
						</TabsTrigger>
					</TabsList>

					{/* 1. 版本流程图谱 (高保真还原观麦 BOM Graph) */}
					<TabsContent value="graph" className="mt-4">
						<div className="bg-slate-50 dark:bg-slate-900/40 rounded-xl p-6 border overflow-x-auto">
							<div className="min-w-[650px] flex items-center justify-between gap-4">
								{/* 左侧：原料投入节点列表 */}
								<div className="flex flex-col gap-3 shrink-0 w-48">
									<div className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1.5">
										<Box className="size-3.5" /> 投入原料 / 辅料
									</div>
									{currentVersion.inputs.map((inp, idx) => (
										<div
											key={idx}
											className="bg-white dark:bg-slate-800 p-3 rounded-lg border shadow-sm flex flex-col gap-1 border-l-4 border-l-cyan-500"
										>
											<div className="text-sm font-semibold text-foreground truncate">
												{inp.productName || inp.productCode}
											</div>
											<div className="text-xs text-muted-foreground flex justify-between font-mono">
												<span>{inp.quantity ?? (inp.ratio ? `${Number(inp.ratio) * 100}%` : "-")} {inp.unitName}</span>
												<Badge variant="outline" size="sm" className="text-[10px] py-0 h-4">
													{inp.materialRole === "MAIN" ? "主料" : "辅料"}
												</Badge>
											</div>
										</div>
									))}
								</div>

								{/* 中间连接箭头 */}
								<div className="shrink-0 flex items-center justify-center">
									<ArrowRight className="size-5 text-muted-foreground/60 animate-pulse" />
								</div>

								{/* 中间：工艺工序菱形节点 */}
								<div className="flex flex-col gap-3 shrink-0 min-w-[180px]">
									<div className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1.5">
										<Clock className="size-3.5" /> 加工工序链
									</div>
									{currentVersion.operations.length > 0 ? (
										currentVersion.operations.map((op, idx) => (
											<div
												key={idx}
												className="relative bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 p-3 rounded-lg flex items-center justify-between text-xs"
											>
												<div>
													<div className="font-semibold text-amber-900 dark:text-amber-200">
														{idx + 1}. {op.operationName || op.operationCode}
													</div>
													{op.standardLaborHours && (
														<div className="text-[10px] text-amber-700/80 dark:text-amber-300/80">
															工时: {op.standardLaborHours}h
														</div>
													)}
												</div>
												{op.qualityCheckpoint && (
													<Badge variant="secondary" size="sm" className="bg-amber-200 dark:bg-amber-900 text-[10px] h-4">
														质检
													</Badge>
												)}
											</div>
										))
									) : (
										<div className="text-xs text-muted-foreground italic p-3 bg-white dark:bg-slate-800 rounded-lg border text-center">
											未配置工序
										</div>
									)}
								</div>

								{/* 中间连接箭头 */}
								<div className="shrink-0 flex items-center justify-center">
									<ArrowRight className="size-5 text-muted-foreground/60 animate-pulse" />
								</div>

								{/* 右侧：产出成品节点 */}
								<div className="flex flex-col gap-3 shrink-0 w-48">
									<div className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1.5">
										<CheckCircle2 className="size-3.5 text-blue-600" /> 最终产出成品
									</div>
									{currentVersion.outputs.map((out, idx) => (
										<div
											key={idx}
											className="bg-blue-600 text-white p-3.5 rounded-lg shadow-sm flex flex-col gap-1 border border-blue-700"
										>
											<div className="text-sm font-bold truncate">
												{out.productName || out.productCode}
											</div>
											<div className="text-xs text-blue-100 flex justify-between font-mono">
												<span>产出: {out.quantity} {out.unitName}</span>
												<span className="bg-blue-700 px-1 rounded text-[10px]">
													{out.outputRole === "PRIMARY" ? "主产品" : "副产品"}
												</span>
											</div>
										</div>
									))}
								</div>
							</div>
						</div>
					</TabsContent>

					{/* 2. 投入清单明细 */}
					<TabsContent value="inputs" className="mt-4">
						<div className="rounded-lg border overflow-hidden">
							<Table className="w-full text-xs">
								<TableHeader className="bg-muted/50 border-b">
									<TableRow>
										<TableHead className="py-2 px-3 text-left font-semibold">物料编码</TableHead>
										<TableHead className="py-2 px-3 text-left font-semibold">投入物料名称</TableHead>
										<TableHead className="py-2 px-3 text-right font-semibold">标准毛投入</TableHead>
										<TableHead className="py-2 px-3 text-left font-semibold">单位</TableHead>
										<TableHead className="py-2 px-3 text-center font-semibold">物料角色</TableHead>
										<TableHead className="py-2 px-3 text-right font-semibold">熟出成率</TableHead>
										<TableHead className="py-2 px-3 text-left font-semibold">供应策略</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody className="divide-y">
									{currentVersion.inputs.map((inp, idx) => (
										<TableRow key={idx} className="hover:bg-muted/20">
											<TableCell className="py-2 px-3 font-mono text-muted-foreground">{inp.productCode}</TableCell>
											<TableCell className="py-2 px-3 font-medium text-foreground">{inp.productName}</TableCell>
											<TableCell className="py-2 px-3 text-right font-mono font-semibold">
												{inp.quantity ?? (inp.ratio ? `${Number(inp.ratio) * 100}%` : "-")}
											</TableCell>
											<TableCell className="py-2 px-3 text-muted-foreground">{inp.unitName}</TableCell>
											<TableCell className="py-2 px-3 text-center">
												<Badge variant="outline" size="sm">
													{inp.materialRole === "MAIN" ? "主料" : inp.materialRole === "AUXILIARY" ? "辅料" : "包材"}
												</Badge>
											</TableCell>
											<TableCell className="py-2 px-3 text-right font-mono text-muted-foreground">
												{inp.cookedYieldRate ? `${Number(inp.cookedYieldRate) * 100}%` : "-"}
											</TableCell>
											<TableCell className="py-2 px-3 text-muted-foreground text-xs">
												{inp.supplyPolicy === "EXTERNAL" ? "外购" : inp.supplyPolicy === "MAKE" ? "自制" : "跟随默认"}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					</TabsContent>

					{/* 3. 产出清单明细 */}
					<TabsContent value="outputs" className="mt-4">
						<div className="rounded-lg border overflow-hidden">
							<Table className="w-full text-xs">
								<TableHeader className="bg-muted/50 border-b">
									<TableRow>
										<TableHead className="py-2 px-3 text-left font-semibold">产出商品编码</TableHead>
										<TableHead className="py-2 px-3 text-left font-semibold">产出商品名称</TableHead>
										<TableHead className="py-2 px-3 text-right font-semibold">标准产出数量</TableHead>
										<TableHead className="py-2 px-3 text-left font-semibold">单位</TableHead>
										<TableHead className="py-2 px-3 text-center font-semibold">角色</TableHead>
										<TableHead className="py-2 px-3 text-left font-semibold">备注说明</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody className="divide-y">
									{currentVersion.outputs.map((out, idx) => (
										<TableRow key={idx} className="hover:bg-muted/20">
											<TableCell className="py-2 px-3 font-mono text-muted-foreground">{out.productCode}</TableCell>
											<TableCell className="py-2 px-3 font-medium text-foreground">{out.productName}</TableCell>
											<TableCell className="py-2 px-3 text-right font-mono font-bold text-blue-600">
												{out.quantity}
											</TableCell>
											<TableCell className="py-2 px-3 text-muted-foreground">{out.unitName}</TableCell>
											<TableCell className="py-2 px-3 text-center">
												<Badge variant={out.outputRole === "PRIMARY" ? "default" : "secondary"} size="sm">
													{out.outputRole === "PRIMARY" ? "主产品" : "副产品"}
												</Badge>
											</TableCell>
											<TableCell className="py-2 px-3 text-muted-foreground">{out.remark || "-"}</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					</TabsContent>

					{/* 4. 工艺路线明细 */}
					<TabsContent value="operations" className="mt-4">
						<div className="rounded-lg border overflow-hidden">
							<Table className="w-full text-xs">
								<TableHeader className="bg-muted/50 border-b">
									<TableRow>
										<TableHead className="py-2 px-3 text-center font-semibold w-16">顺序</TableHead>
										<TableHead className="py-2 px-3 text-left font-semibold">工序名称</TableHead>
										<TableHead className="py-2 px-3 text-left font-semibold">工序编码</TableHead>
										<TableHead className="py-2 px-3 text-right font-semibold">准备/清理(分)</TableHead>
										<TableHead className="py-2 px-3 text-right font-semibold">标准工时</TableHead>
										<TableHead className="py-2 px-3 text-center font-semibold">质检点</TableHead>
										<TableHead className="py-2 px-3 text-left font-semibold">操作指导</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody className="divide-y">
									{currentVersion.operations.map((op, idx) => (
										<TableRow key={idx} className="hover:bg-muted/20">
											<TableCell className="py-2 px-3 text-center font-mono font-semibold">{op.sequenceNumber}</TableCell>
											<TableCell className="py-2 px-3 font-medium text-foreground">{op.operationName}</TableCell>
											<TableCell className="py-2 px-3 font-mono text-muted-foreground">{op.operationCode}</TableCell>
											<TableCell className="py-2 px-3 text-right font-mono text-muted-foreground">
												{op.setupMinutes ?? 0} / {op.cleanupMinutes ?? 0}
											</TableCell>
											<TableCell className="py-2 px-3 text-right font-mono font-semibold">
												{op.standardLaborHours ? `${op.standardLaborHours}h` : "-"}
											</TableCell>
											<TableCell className="py-2 px-3 text-center">
												{op.qualityCheckpoint ? (
													<Badge variant="default" size="sm" className="bg-amber-600 hover:bg-amber-600">质检</Badge>
												) : (
													<span className="text-muted-foreground">-</span>
												)}
											</TableCell>
											<TableCell className="py-2 px-3 text-muted-foreground truncate max-w-xs">
												{op.instructionText || "-"}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					</TabsContent>
				</Tabs>
			</SheetContent>
		</Sheet>
	);
}
