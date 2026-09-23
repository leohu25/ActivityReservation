"use client";

import { useState } from "react";
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
	Table,
	TableHeader,
	TableBody,
	TableHead,
	TableRow,
	TableCell,
	Select,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectItem,
	ConfirmDialog,
} from "@base/ui";
import {
	GitBranch,
	Check,
} from "lucide-react";
import { StandardAction, useAbility } from "@base/authorization";
import { BomSubject, BomAction } from "../contract";
import type { BomDetailDto } from "../types";
import { BomFlowGraph } from "./BomFlowGraph";

export interface BomDetailDrawerProps {
	readonly open: boolean;
	readonly onOpenChange: (open: boolean) => void;
	readonly detail: BomDetailDto | null;
	readonly onEdit?: (detail: BomDetailDto) => void;
	readonly onSelectVersion?: (versionNumber: number) => void;
	readonly onPublishVersion?: (bomId: string, versionNumber: number) => void;
}

const BOM_TYPE_BADGES: Record<
	string,
	{ label: string; variant: "default" | "secondary" | "outline" }
> = {
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
	onPublishVersion,
}: BomDetailDrawerProps) {
	const ability = useAbility();
	const [activeTab, setActiveTab] = useState("graph");

	if (!detail) return null;

	const canUpdate = ability.can(StandardAction.UPDATE, BomSubject);
	const canPublish = ability.can(BomAction.PUBLISH, BomSubject);

	const { currentVersion, primaryProduct, isDefault, versionHistory } = detail;
	const typeConfig = BOM_TYPE_BADGES[currentVersion.bomType] ?? {
		label: currentVersion.bomType,
		variant: "secondary",
	};

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="w-[85vw] !max-w-[1400px] overflow-y-auto p-6 flex flex-col gap-0">
				{/* 头部元信息 */}
				<SheetHeader className="pb-4 border-b">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<SheetTitle className="text-xl font-bold flex items-center gap-2">
								{primaryProduct.name}
								{isDefault && (
									<Badge
										variant="default"
										size="sm"
										className="bg-blue-600 hover:bg-blue-600"
									>
										默认BOM
									</Badge>
								)}
								<Badge variant={typeConfig.variant} size="sm">
									{typeConfig.label}
								</Badge>
							</SheetTitle>
						</div>
						{canPublish && currentVersion.versionStatus === "DRAFT" && onPublishVersion && (
							<ConfirmDialog
								trigger={
									<Button
										size="sm"
										className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
									>
										<Check className="size-3.5" /> 发布当前版本
									</Button>
								}
								title={`确认发布 ${primaryProduct.name} 版本 ${currentVersion.versionNumber}？`}
								description="发布后该版本将切换为生效标准，只影响后续未生成的生产计划，已生成的计划不受影响。"
								confirmText="确认发布"
								cancelText="取消"
								onConfirm={() =>
									onPublishVersion(detail.id, currentVersion.versionNumber)
								}
							/>
						)}
						{canUpdate && onEdit && (
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
					<SheetDescription className="flex flex-wrap items-center gap-x-6 gap-y-1.5 text-xs text-muted-foreground mt-2">
						<span>
							BOM 编码:{" "}
							<strong className="font-mono text-foreground">
								{currentVersion.code}
							</strong>
						</span>
						<span>
							方案名称:{" "}
							<strong className="text-foreground">
								{currentVersion.name}
							</strong>
						</span>
						<span>
							生产产线:{" "}
							<strong className="text-foreground">
								{currentVersion.productionLineName || "未指定"}
							</strong>
						</span>
						{currentVersion.totalYieldEnabled && (
							<span>
								总出成率:{" "}
								<strong className="text-emerald-600 font-semibold font-mono">
									{Number(currentVersion.totalYieldRate || 1) * 100}%
								</strong>
							</span>
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
							<SelectTrigger className="h-8 w-32 text-xs font-mono">
								<SelectValue
									placeholder={`版本 ${currentVersion.versionNumber}`}
								/>
							</SelectTrigger>
							<SelectContent>
								{versionHistory.map((v) => (
									<SelectItem key={v.id} value={String(v.versionNumber)}>
										版本 {v.versionNumber} (
										{v.versionStatus === "PUBLISHED" ? "已发布" : "草稿"})
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<span className="text-xs text-muted-foreground">
						{currentVersion.description || "无版本描述"}
					</span>
				</div>

				<Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
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

					{/* 1. 版本流程图谱 (高保真还原观麦 BOM Graph 设计) */}
					<TabsContent value="graph" className="mt-4 flex-1">
						<BomFlowGraph detail={detail} />
					</TabsContent>

					{/* 2. 投入清单明细表格 */}
					<TabsContent value="inputs" className="mt-4">
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
										<TableHead className="py-2 px-3 text-right font-semibold">
											熟出成率
										</TableHead>
										<TableHead className="py-2 px-3 text-left font-semibold">
											供应策略
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody className="divide-y">
									{currentVersion.inputs.map((inp, idx) => (
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
											<TableCell className="py-2 px-3 text-right font-mono text-muted-foreground">
												{inp.cookedYieldRate
													? `${Number(inp.cookedYieldRate) * 100}%`
													: "-"}
											</TableCell>
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
					</TabsContent>

					{/* 3. 产出清单明细表格 */}
					<TabsContent value="outputs" className="mt-4">
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
									{currentVersion.outputs.map((out, idx) => (
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
														out.outputRole === "PRIMARY"
															? "default"
															: "secondary"
													}
													size="sm"
												>
													{out.outputRole === "PRIMARY"
														? "主产物"
														: "副产物/下脚料"}
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
					</TabsContent>

					{/* 4. 工艺工序路线明细表格 */}
					<TabsContent value="operations" className="mt-4">
						<div className="rounded-lg border overflow-hidden">
							<Table className="w-full text-xs">
								<TableHeader className="bg-muted/50 border-b">
									<TableRow>
										<TableHead className="py-2 px-3 text-center font-semibold w-16">
											序号
										</TableHead>
										<TableHead className="py-2 px-3 text-left font-semibold">
											工序编码
										</TableHead>
										<TableHead className="py-2 px-3 text-left font-semibold">
											工序名称
										</TableHead>
										<TableHead className="py-2 px-3 text-right font-semibold">
											准备工时(分)
										</TableHead>
										<TableHead className="py-2 px-3 text-right font-semibold">
											清理工时(分)
										</TableHead>
										<TableHead className="py-2 px-3 text-right font-semibold">
											标准工时(小时)
										</TableHead>
										<TableHead className="py-2 px-3 text-center font-semibold">
											质量检查点
										</TableHead>
										<TableHead className="py-2 px-3 text-left font-semibold">
											作业标准要求 (SOP)
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody className="divide-y">
									{currentVersion.operations.map((op, idx) => (
										<TableRow key={idx} className="hover:bg-muted/20">
											<TableCell className="py-2 px-3 text-center font-mono text-muted-foreground">
												{idx + 1}
											</TableCell>
											<TableCell className="py-2 px-3 font-mono text-muted-foreground">
												{op.operationCode}
											</TableCell>
											<TableCell className="py-2 px-3 font-medium text-foreground">
												{op.operationName}
											</TableCell>
											<TableCell className="py-2 px-3 text-right font-mono text-muted-foreground">
												{op.setupMinutes ?? "-"}
											</TableCell>
											<TableCell className="py-2 px-3 text-right font-mono text-muted-foreground">
												{op.cleanupMinutes ?? "-"}
											</TableCell>
											<TableCell className="py-2 px-3 text-right font-mono text-muted-foreground">
												{op.standardLaborHours ?? "-"}
											</TableCell>
											<TableCell className="py-2 px-3 text-center">
												{op.qualityCheckpoint ? (
													<Badge
														variant="secondary"
														size="sm"
														className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200"
													>
														质检点
													</Badge>
												) : (
													<span className="text-muted-foreground">-</span>
												)}
											</TableCell>
											<TableCell className="py-2 px-3 text-muted-foreground">
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
