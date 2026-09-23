"use client";

import { useState, useMemo, useCallback } from "react";
import type { BomDetailDto } from "../../types";
import { getBomDetailAction } from "../../actions";
import type {
	BomFlowGraphProps,
	GraphInputNode,
	GraphOperationNode,
	GraphOutputNode,
} from "./types";
import { useGraphLayout } from "./useGraphLayout";
import { GraphToolbar } from "./GraphToolbar";
import { GraphSvgWires } from "./GraphSvgWires";
import { InputNodeCard } from "./InputNodeCard";
import { SubGraphPanel } from "./SubGraphPanel";
import { OperationNodeItem } from "./OperationNodeItem";
import { OutputNodeCard } from "./OutputNodeCard";

export type { BomFlowGraphProps };

/**
 * 生产 BOM 流程图谱顶层积木装配器：
 * 采用积木化组装架构，聚合工具栏、SVG 连线层、投入卡片、子图谱面板、工序菱形与产出卡片
 */
export function BomFlowGraph({ detail, onNavigateBom }: BomFlowGraphProps) {
	const { currentVersion } = detail;

	// 嵌套子 BOM 展开状态与数据缓存
	const [expandedSubBoms, setExpandedSubBoms] = useState<Record<string, boolean>>({});
	const [subBomData, setSubBomData] = useState<Record<string, BomDetailDto>>({});
	const [loadingSubBoms, setLoadingSubBoms] = useState<Record<string, boolean>>({});

	// 解析出图谱所需的节点数据
	const { inputNodes, operationNodes, outputNodes } = useMemo(() => {
		const inputs: GraphInputNode[] = currentVersion.inputs.map((inp, idx) => {
			const qtyStr =
				inp.quantity != null
					? `${inp.quantity} ${inp.unitName || ""}`
					: inp.ratio != null
						? `${Number(inp.ratio) * 100}%`
						: "-";

			const isSub = inp.supplyPolicy === "MAKE" || Boolean(inp.childBomId);

			return {
				id: inp.id || `inp-${idx}`,
				name: inp.productName || inp.productCode || "物料",
				quantity: qtyStr,
				unit: inp.unitName || "",
				cost: "成本: -",
				isSubBom: isSub,
				childBomId: inp.childBomId,
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

	// 单项子 BOM 展开与按需异步加载
	const handleToggleSubBom = useCallback(
		async (inpId: string, childBomId: string) => {
			const isExpanded = Boolean(expandedSubBoms[inpId]);
			if (!isExpanded && !subBomData[childBomId]) {
				setLoadingSubBoms((prev) => ({ ...prev, [inpId]: true }));
				try {
					const res = await getBomDetailAction(childBomId);
					if (res.success && res.data) {
						setSubBomData((prev) => ({ ...prev, [childBomId]: res.data }));
					}
				} catch (err) {
					console.error("加载子 BOM 详情失败:", err);
				} finally {
					setLoadingSubBoms((prev) => ({ ...prev, [inpId]: false }));
				}
			}
			setExpandedSubBoms((prev) => ({ ...prev, [inpId]: !isExpanded }));
		},
		[expandedSubBoms, subBomData],
	);

	// 一键全部展开 / 收起子图谱
	const subBomInputs = useMemo(
		() => inputNodes.filter((n) => n.isSubBom && n.childBomId),
		[inputNodes],
	);
	const allSubExpanded =
		subBomInputs.length > 0 &&
		subBomInputs.every((n) => expandedSubBoms[n.id]);

	const handleToggleAllSubBoms = useCallback(async () => {
		const targetExpand = !allSubExpanded;
		if (targetExpand) {
			for (const n of subBomInputs) {
				if (n.childBomId && !subBomData[n.childBomId]) {
					setLoadingSubBoms((prev) => ({ ...prev, [n.id]: true }));
					try {
						const res = await getBomDetailAction(n.childBomId);
						if (res.success && res.data) {
							setSubBomData((prev) => ({ ...prev, [n.childBomId!]: res.data }));
						}
					} catch (err) {
						console.error("加载子 BOM 详情失败:", err);
					} finally {
						setLoadingSubBoms((prev) => ({ ...prev, [n.id]: false }));
					}
				}
			}
		}
		const nextState: Record<string, boolean> = {};
		subBomInputs.forEach((n) => {
			nextState[n.id] = targetExpand;
		});
		setExpandedSubBoms(nextState);
	}, [allSubExpanded, subBomInputs, subBomData]);

	// 纯逻辑布局计算
	const hasExpandedSubBom = inputNodes.some(
		(n) => n.isSubBom && expandedSubBoms[n.id],
	);
	const layout = useGraphLayout(inputNodes, operationNodes, hasExpandedSubBom);
	const {
		nodeHeight,
		nodeGap,
		inputsTotalHeight,
		containerHeight,
		centerY,
		col2X,
		opsStartX,
		minWidth,
	} = layout;

	return (
		<div className="w-full flex-1 flex flex-col select-none bg-white dark:bg-slate-950 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm min-h-[580px]">
			{/* 1. 顶部工具栏积木 */}
			<GraphToolbar
				subBomCount={subBomInputs.length}
				allSubExpanded={allSubExpanded}
				onToggleAllSubBoms={handleToggleAllSubBoms}
			/>

			{/* 2. 主画布视窗 */}
			<div className="w-full overflow-x-auto flex-1">
				<div
					className="relative"
					style={{ height: `${containerHeight}px`, minWidth: `${minWidth}px` }}
				>
					{/* 2.1 SVG 矢量流向连线层 */}
					<GraphSvgWires
						inputNodes={inputNodes}
						operationNodes={operationNodes}
						outputNodes={outputNodes}
						layout={layout}
						expandedSubBoms={expandedSubBoms}
					/>

					{/* 2.2 嵌套子 BOM 展开专属流程面板 */}
					{inputNodes.map((inp, idx) => {
						const isExpanded = inp.isSubBom && expandedSubBoms[inp.id];
						if (!isExpanded) return null;
						const nodeY =
							centerY - inputsTotalHeight / 2 + idx * (nodeHeight + nodeGap);

						return (
							<SubGraphPanel
								key={`sub-panel-${inp.id}`}
								subDetail={inp.childBomId ? subBomData[inp.childBomId] : null}
								isLoading={Boolean(loadingSubBoms[inp.id])}
								fallbackName={inp.name}
								childBomId={inp.childBomId}
								top={nodeY - 8}
								height={nodeHeight + 16}
								onNavigateBom={onNavigateBom}
							/>
						);
					})}

					{/* 2.3 主投入物料卡片列 */}
					{inputNodes.map((inp, idx) => {
						const nodeY =
							centerY - inputsTotalHeight / 2 + idx * (nodeHeight + nodeGap);

						return (
							<InputNodeCard
								key={inp.id}
								node={inp}
								isExpanded={Boolean(inp.isSubBom && expandedSubBoms[inp.id])}
								isLoading={Boolean(loadingSubBoms[inp.id])}
								left={col2X}
								top={nodeY}
								height={nodeHeight}
								onToggleSubBom={handleToggleSubBom}
							/>
						);
					})}

					{/* 2.4 工艺工序菱形流程链 */}
					{operationNodes.map((op, idx) => {
						const opX = opsStartX + idx * 160;
						return (
							<OperationNodeItem
								key={op.id}
								op={op}
								left={opX}
								centerY={centerY}
							/>
						);
					})}

					{/* 2.5 最终产出成品与副产品卡片列 */}
					{outputNodes.map((out, idx) => {
						const outX =
							opsStartX +
							Math.max(operationNodes.length, 1) * 160 +
							20;
						const nodeY =
							centerY - nodeHeight / 2 + idx * (nodeHeight + nodeGap);

						return (
							<OutputNodeCard
								key={out.id}
								out={out}
								left={outX}
								top={nodeY}
								height={nodeHeight}
							/>
						);
					})}
				</div>
			</div>
		</div>
	);
}
