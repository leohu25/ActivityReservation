import type {
	GraphInputNode,
	GraphOperationNode,
	GraphOutputNode,
	GraphLayoutMetrics,
} from "./types";

export interface GraphSvgWiresProps {
	readonly inputNodes: readonly GraphInputNode[];
	readonly operationNodes: readonly GraphOperationNode[];
	readonly outputNodes: readonly GraphOutputNode[];
	readonly layout: GraphLayoutMetrics;
	readonly expandedSubBoms: Record<string, boolean>;
}

/**
 * 图谱 SVG 矢量连线层：绘制母线、工序链流向线、子图谱连接虚线与箭头标记
 */
export function GraphSvgWires({
	inputNodes,
	operationNodes,
	outputNodes,
	layout,
	expandedSubBoms,
}: GraphSvgWiresProps) {
	const {
		nodeHeight,
		nodeGap,
		inputsTotalHeight,
		centerY,
		col2X,
		busLineX,
		opsStartX,
	} = layout;

	return (
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
					centerY -
					inputsTotalHeight / 2 +
					idx * (nodeHeight + nodeGap) +
					nodeHeight / 2;
				const startX = col2X + 180; // 投入卡片右侧边缘

				return (
					<g key={`bus-in-${idx}`}>
						<line
							x1={startX}
							y1={startY}
							x2={busLineX}
							y2={startY}
							stroke="#f97316"
							strokeWidth="1.5"
						/>
						{/* 汇聚圆点 (橙色空心圆) */}
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

			{/* 2. 垂直汇流母线 */}
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

			{/* 6. 若展开子BOM，绘制子级工序 -> 投入半成品的平滑流向连接线 */}
			{inputNodes.map((inp, idx) => {
				const isExpanded = inp.isSubBom && expandedSubBoms[inp.id];
				if (!isExpanded) return null;
				const nodeY =
					centerY -
					inputsTotalHeight / 2 +
					idx * (nodeHeight + nodeGap) +
					nodeHeight / 2;

				const subPanelRight = 520; // left(20) + width(500)
				return (
					<g key={`sub-wire-${idx}`}>
						<line
							x1={subPanelRight}
							y1={nodeY}
							x2={col2X - 8}
							y2={nodeY}
							stroke="#06b6d4"
							strokeWidth="1.8"
							strokeDasharray="4 3"
							markerEnd="url(#arrow-cyan)"
						/>
					</g>
				);
			})}
		</svg>
	);
}
