import { useMemo } from "react";
import type { GraphInputNode, GraphOperationNode, GraphLayoutMetrics } from "./types";

export function useGraphLayout(
	inputNodes: readonly GraphInputNode[],
	operationNodes: readonly GraphOperationNode[],
	hasExpandedSubBom: boolean,
): GraphLayoutMetrics {
	return useMemo(() => {
		const nodeHeight = 88;
		const nodeGap = 32;
		const inputCount = Math.max(inputNodes.length, 1);
		const inputsTotalHeight = inputCount * nodeHeight + (inputCount - 1) * nodeGap;
		// 容器高度扩充至 580px+，彻底消除下方无效空白
		const containerHeight = Math.max(inputsTotalHeight + 280, 580);
		const centerY = containerHeight / 2;

		// 当存在展开的子图谱时，主投入列右移为子图谱让出左侧 530px 空间；折叠时则靠左自适应
		const col2X = hasExpandedSubBom ? 530 : 70;
		const busLineX = col2X + 170 + 40;
		const opsStartX = busLineX + 50;

		const minWidth = hasExpandedSubBom
			? Math.max(opsStartX + Math.max(operationNodes.length, 1) * 160 + 260, 1440)
			: Math.max(opsStartX + Math.max(operationNodes.length, 1) * 160 + 260, 1080);

		return {
			nodeHeight,
			nodeGap,
			inputsTotalHeight,
			containerHeight,
			centerY,
			hasExpandedSubBom,
			col2X,
			busLineX,
			opsStartX,
			minWidth,
		};
	}, [inputNodes.length, operationNodes.length, hasExpandedSubBom]);
}
