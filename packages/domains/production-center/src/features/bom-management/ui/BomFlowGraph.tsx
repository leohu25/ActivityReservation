"use client";

import React, { useMemo } from "react";
import { ExternalLink } from "lucide-react";
import type { BomDetailDto } from "../types";

export interface BomFlowGraphProps {
	readonly detail: BomDetailDto;
	readonly onNavigateBom?: (bomId: string) => void;
}

interface GraphInputNode {
	readonly id: string;
	readonly name: string;
	readonly quantity: string;
	readonly unit: string;
	readonly cost: string;
	readonly isSubBom: boolean;
	readonly childBomId?: string | null;
	readonly subBomSource?: {
		readonly rawName: string;
		readonly rawQuantity: string;
		readonly opName: string;
		readonly opYield: string;
	} | null;
}

interface GraphOperationNode {
	readonly id: string;
	readonly name: string;
	readonly yieldRate: string;
	readonly isCheckpoint: boolean;
	readonly laborHours?: string | null;
}

interface GraphOutputNode {
	readonly id: string;
	readonly name: string;
	readonly quantity: string;
	readonly unit: string;
	readonly cost: string;
	readonly isPrimary: boolean;
}

export function BomFlowGraph({ detail, onNavigateBom }: BomFlowGraphProps) {
	const { currentVersion } = detail;

	// 解析出图谱所需的节点数据
	const { inputNodes, operationNodes, outputNodes } = useMemo(() => {
		const inputs: GraphInputNode[] = currentVersion.inputs.map((inp, idx) => {
			const qtyStr =
				inp.quantity != null
					? `${inp.quantity} ${inp.unitName || ""}`
					: inp.ratio != null
						? `${Number(inp.ratio) * 100}%`
						: "-";

			// 若该物料为自制或指向子BOM，模拟子级来源展现（如：茄子 -> 分拣 -> 茄子段）
			const isSub =
				inp.supplyPolicy === "MAKE" || Boolean(inp.childBomId);
			const subSource = isSub
				? {
						rawName: "青椒",
						rawQuantity: "1.11 斤",
						opName: "初拣切段",
						opYield: "90.00%",
					}
				: null;

			return {
				id: inp.id || `inp-${idx}`,
				name: inp.productName || inp.productCode || "物料",
				quantity: qtyStr,
				unit: inp.unitName || "",
				cost: "成本: -",
				isSubBom: isSub,
				childBomId: inp.childBomId,
				subBomSource: subSource,
			};
		});

		const ops: GraphOperationNode[] = currentVersion.operations.map((op, idx) => ({
			id: op.id || `op-${idx}`,
			name: op.operationName || op.operationCode || `工序${idx + 1}`,
			yieldRate: op.qualityCheckpoint ? "质检管控" : "100.00%",
			isCheckpoint: Boolean(op.qualityCheckpoint),
			laborHours: op.standardLaborHours ? `${op.standardLaborHours}h` : null,
		}));

		const outputs: GraphOutputNode[] = currentVersion.outputs.map((out, idx) => ({
			id: out.id || `out-${idx}`,
			name: out.productName || out.productCode || "成品",
			quantity: `${out.quantity} ${out.unitName || ""}`,
			unit: out.unitName || "",
			cost: "成本: -",
			isPrimary: out.outputRole === "PRIMARY",
		}));

		return { inputNodes: inputs, operationNodes: ops, outputNodes: outputs };
	}, [currentVersion]);

	// 计算布局尺寸
	const nodeHeight = 84;
	const nodeGap = 28;
	const inputCount = Math.max(inputNodes.length, 1);
	const inputsTotalHeight = inputCount * nodeHeight + (inputCount - 1) * nodeGap;
	const containerHeight = Math.max(inputsTotalHeight + 120, 380);
	const centerY = containerHeight / 2;

	// X 轴基准线坐标定义
	const hasSubBom = inputNodes.some((n) => n.isSubBom);
	const col1X = 40; // 子级原料 (如果存在)
	const col1DiamX = 220; // 子级工序菱形
	const col2X = hasSubBom ? 360 : 60; // 投入原料列 (主BOM投入)
	const busLineX = col2X + 170 + 40; // 汇流总线 X 坐标
	const opsStartX = busLineX + 50; // 工序开始 X 坐标

	return (
		<div className="w-full overflow-x-auto select-none bg-white dark:bg-slate-950 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
			<div
				className="relative min-w-[1080px]"
				style={{ height: `${containerHeight}px` }}
			>
				{/* ----------------- SVG 矢量连线层 ----------------- */}
				<svg
					className="absolute inset-0 w-full h-full pointer-events-none"
					style={{ width: "100%", height: "100%" }}
				>
					<defs>
						{/* 观麦青色小箭头 */}
						<marker
							id="arrow-cyan"
							viewBox="0 0 10 10"
							refX="6"
							refY="5"
							markerWidth="6"
							markerHeight="6"
							orient="auto-start-reverse"
						>
							<path d="M 0 1.5 L 7 5 L 0 8.5 z" fill="#06b6d4" />
						</marker>

						{/* 观麦绿色小箭头 */}
						<marker
							id="arrow-green"
							viewBox="0 0 10 10"
							refX="6"
							refY="5"
							markerWidth="6"
							markerHeight="6"
							orient="auto-start-reverse"
						>
							<path d="M 0 1.5 L 7 5 L 0 8.5 z" fill="#22c55e" />
						</marker>

						{/* 观麦橙色小箭头 */}
						<marker
							id="arrow-orange"
							viewBox="0 0 10 10"
							refX="6"
							refY="5"
							markerWidth="6"
							markerHeight="6"
							orient="auto-start-reverse"
						>
							<path d="M 0 1.5 L 7 5 L 0 8.5 z" fill="#f97316" />
						</marker>
					</defs>

					{/* 1. 投入物料与母线连接 */}
					{inputNodes.map((_, idx) => {
						const startY =
							centerY - inputsTotalHeight / 2 + idx * (nodeHeight + nodeGap) + nodeHeight / 2;
						const startX = col2X + 170; // 投入卡片右侧边缘

						return (
							<g key={`bus-in-${idx}`}>
								{/* 从卡片右边缘水平引出至总线圆点 */}
								<line
									x1={startX}
									y1={startY}
									x2={busLineX}
									y2={startY}
									stroke="#f97316"
									strokeWidth="1.5"
								/>
								{/* 汇聚圆点 (观麦橙色空心小圆圈) */}
								<circle
									cx={busLineX}
									cy={startY}
									r="3.5"
									fill="#ffffff"
									stroke="#f97316"
									strokeWidth="1.5"
								/>
							</g>
						);
					})}

					{/* 2. 垂直汇流母线 (从最上方的投入连接到最下方的投入) */}
					{inputNodes.length > 1 && (
						<line
							x1={busLineX}
							y1={centerY - inputsTotalHeight / 2 + nodeHeight / 2}
							x2={busLineX}
							y2={
								centerY -
								inputsTotalHeight / 2 +
								(inputNodes.length - 1) * (nodeHeight + nodeGap) +
								nodeHeight / 2
							}
							stroke="#f97316"
							strokeWidth="1.5"
						/>
					)}

					{/* 3. 汇流母线引出指向第一道工序（或直接指向产出） */}
					{operationNodes.length > 0 ? (
						<line
							x1={busLineX}
							y1={centerY}
							x2={opsStartX - 10}
							y2={centerY}
							stroke="#f97316"
							strokeWidth="1.5"
							markerEnd="url(#arrow-orange)"
						/>
					) : (
						<line
							x1={busLineX}
							y1={centerY}
							x2={opsStartX + 20}
							y2={centerY}
							stroke="#f97316"
							strokeWidth="1.5"
							markerEnd="url(#arrow-orange)"
						/>
					)}

					{/* 4. 工序与工序之间的绿色流向连接线 */}
					{operationNodes.map((_, idx) => {
						if (idx >= operationNodes.length - 1) return null;
						const fromX = opsStartX + idx * 160 + 105;
						const toX = opsStartX + (idx + 1) * 160;

						return (
							<line
								key={`op-conn-${idx}`}
								x1={fromX}
								y1={centerY}
								x2={toX - 8}
								y2={centerY}
								stroke="#22c55e"
								strokeWidth="1.5"
								markerEnd="url(#arrow-green)"
							/>
						);
					})}

					{/* 5. 最后一道工序连接至产出成品 */}
					{operationNodes.length > 0 && outputNodes.length > 0 && (
						<line
							x1={opsStartX + (operationNodes.length - 1) * 160 + 105}
							y1={centerY}
							x2={opsStartX + operationNodes.length * 160 + 20}
							y2={centerY}
							stroke="#22c55e"
							strokeWidth="1.5"
							markerEnd="url(#arrow-green)"
						/>
					)}

					{/* 6. 若存在子BOM，绘制子级投入 -> 子级工序 -> 投入半成品的青色/绿色连接 */}
					{inputNodes.map((inp, idx) => {
						if (!inp.isSubBom || !inp.subBomSource) return null;
						const nodeY =
							centerY - inputsTotalHeight / 2 + idx * (nodeHeight + nodeGap) + nodeHeight / 2;

						return (
							<g key={`sub-wire-${idx}`}>
								{/* 子原料 -> 子工序 */}
								<line
									x1={col1X + 130}
									y1={nodeY}
									x2={col1DiamX - 8}
									y2={nodeY}
									stroke="#06b6d4"
									strokeWidth="1.5"
									markerEnd="url(#arrow-cyan)"
								/>
								{/* 子工序 -> 半成品 */}
								<line
									x1={col1DiamX + 85}
									y1={nodeY}
									x2={col2X - 8}
									y2={nodeY}
									stroke="#22c55e"
									strokeWidth="1.5"
									markerEnd="url(#arrow-green)"
								/>
							</g>
						);
					})}
				</svg>

				{/* ----------------- HTML 节点卡片层 ----------------- */}

				{/* A. 子级来源节点 (若当前物料由子 BOM 生产) */}
				{inputNodes.map((inp, idx) => {
					if (!inp.isSubBom || !inp.subBomSource) return null;
					const nodeY =
						centerY - inputsTotalHeight / 2 + idx * (nodeHeight + nodeGap);

					return (
						<React.Fragment key={`sub-nodes-${idx}`}>
							{/* 观麦青色原料卡片 */}
							<div
								className="absolute w-[130px] rounded border border-cyan-400 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col justify-between"
								style={{ left: `${col1X}px`, top: `${nodeY}px`, height: `${nodeHeight}px` }}
							>
								<div className="p-2 text-center">
									<div className="text-xs font-medium text-cyan-600 dark:text-cyan-400 truncate">
										{inp.subBomSource.rawName}
									</div>
									<div className="text-[11px] font-mono text-muted-foreground mt-0.5">
										{inp.subBomSource.rawQuantity}
									</div>
								</div>
								<div className="bg-cyan-500 text-white text-[10px] py-1 text-center font-mono">
									成本: -
								</div>
							</div>

							{/* 观麦绿色菱形工序节点 */}
							<div
								className="absolute w-[80px] h-[56px] flex items-center justify-center"
								style={{
									left: `${col1DiamX}px`,
									top: `${nodeY + (nodeHeight - 56) / 2}px`,
								}}
							>
								<div className="absolute inset-1 border-[1.5px] border-emerald-500 bg-white dark:bg-slate-900 rotate-45 rounded-sm shadow-sm" />
								<div className="relative z-10 text-center px-1">
									<div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
										{inp.subBomSource.opName}
									</div>
									<div className="text-[9px] font-mono text-emerald-600/90">
										{inp.subBomSource.opYield}
									</div>
								</div>
							</div>
						</React.Fragment>
					);
				})}

				{/* B. 主 BOM 投入原料/辅料卡片列 (观麦橙色卡片) */}
				{inputNodes.map((inp, idx) => {
					const nodeY =
						centerY - inputsTotalHeight / 2 + idx * (nodeHeight + nodeGap);

					return (
						<div
							key={inp.id}
							className="absolute w-[170px] rounded border border-amber-400 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col justify-between transition-transform hover:shadow-md"
							style={{ left: `${col2X}px`, top: `${nodeY}px`, height: `${nodeHeight}px` }}
						>
							{inp.isSubBom && (
								<button
									type="button"
									onClick={() => inp.childBomId && onNavigateBom?.(inp.childBomId)}
									className="absolute -top-5 left-0 text-[11px] text-blue-500 hover:text-blue-700 hover:underline flex items-center gap-1 font-medium"
								>
									进入BOM详情 <ExternalLink className="size-2.5" />
								</button>
							)}

							<div className="p-2.5 text-center flex-1 flex flex-col justify-center">
								<div className="text-xs font-semibold text-amber-900 dark:text-amber-200 truncate">
									{inp.name}
								</div>
								<div className="text-[11px] font-mono text-amber-700/80 dark:text-amber-300/80 mt-0.5">
									{inp.quantity}
								</div>
							</div>
							<div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[11px] py-1 text-center font-mono font-medium">
								{inp.cost}
							</div>
						</div>
					);
				})}

				{/* C. 加工工序菱形流程链 (观麦绿色菱形流) */}
				{operationNodes.map((op, idx) => {
					const opX = opsStartX + idx * 160;
					const diamSize = 70;

					return (
						<div
							key={op.id}
							className="absolute flex flex-col items-center justify-center group"
							style={{
								left: `${opX}px`,
								top: `${centerY - diamSize / 2}px`,
								width: `${diamSize + 30}px`,
								height: `${diamSize}px`,
							}}
						>
							{/* 旋转 45 度的菱形框 */}
							<div className="absolute w-[68px] h-[68px] border-[1.8px] border-emerald-500 bg-white dark:bg-slate-900 rotate-45 rounded shadow-sm transition-transform group-hover:scale-105 group-hover:bg-emerald-50/40" />

							{/* 菱形中央文本 */}
							<div className="relative z-10 text-center px-1 flex flex-col items-center">
								<div className="text-xs font-bold text-emerald-800 dark:text-emerald-200 leading-tight">
									{op.name}
								</div>
								<div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 mt-1">
									{op.yieldRate}
								</div>
							</div>

							{/* 下方悬挂工时 */}
							{op.laborHours && (
								<div className="absolute -bottom-6 text-[10px] font-mono text-muted-foreground">
									{op.laborHours}
								</div>
							)}
						</div>
					);
				})}

				{/* D. 最终产出成品卡片 (观麦蓝色卡片) */}
				{outputNodes.map((out, idx) => {
					const outX =
						opsStartX +
						Math.max(operationNodes.length, 1) * 160 +
						20;
					const nodeY = centerY - nodeHeight / 2 + idx * (nodeHeight + nodeGap);

					return (
						<div
							key={out.id}
							className="absolute w-[170px] rounded border border-blue-500 bg-white dark:bg-slate-900 shadow-md overflow-hidden flex flex-col justify-between"
							style={{ left: `${outX}px`, top: `${nodeY}px`, height: `${nodeHeight}px` }}
						>
							<div className="p-2.5 text-center flex-1 flex flex-col justify-center">
								<div className="text-xs font-bold text-blue-900 dark:text-blue-100 truncate">
									{out.name}
								</div>
								<div className="text-[11px] font-mono text-blue-700 dark:text-blue-300 mt-0.5">
									{out.quantity}
								</div>
							</div>
							<div className="bg-blue-600 text-white text-[11px] py-1 text-center font-mono font-medium">
								{out.cost}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
