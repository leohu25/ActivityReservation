import { Clock, Plus, Trash2 } from "lucide-react";
import {
	Button,
	Combobox,
	Input,
	Switch,
	Table,
	TableHeader,
	TableBody,
	TableHead,
	TableRow,
	TableCell,
} from "@base/ui";
import type { BomFormOptions } from "../../types";
import type { FormOperationRow } from "./types";

export interface OperationRoutesSectionProps {
	readonly isView: boolean;
	readonly operations: readonly FormOperationRow[];
	readonly formOptions: BomFormOptions;
	readonly handleAddOperation: () => void;
	readonly handleRemoveOperation: (idx: number) => void;
	readonly handleUpdateOperation: (
		idx: number,
		field: string,
		value: unknown,
	) => void;
}

interface OperationTableRowProps {
	readonly op: FormOperationRow;
	readonly idx: number;
	readonly isView: boolean;
	readonly formOptions: BomFormOptions;
	readonly onUpdate: (idx: number, field: string, value: unknown) => void;
	readonly onRemove: (idx: number) => void;
}

function OperationTableRow({
	op,
	idx,
	isView,
	formOptions,
	onUpdate,
	onRemove,
}: OperationTableRowProps) {
	const currentOp = formOptions.operations.find((o) => o.id === op.operationId);
	const operationName = currentOp?.name || op.operationId;

	// 根据当前选定工序，过滤出属于该工序的加工规格候选 (1对多明细)
	const specOptions =
		currentOp?.specifications.map((s) => ({
			value: s.id,
			label: s.name ? `${s.name} (${s.code})` : s.code,
		})) || [];

	const selectedSpec = currentOp?.specifications.find(
		(s) => s.id === op.processingSpecificationId,
	);

	return (
		<TableRow>
			<TableCell className="py-1.5 px-3 text-center">
				<Input
					type="number"
					value={op.sequenceNumber}
					disabled={isView}
					onChange={(e) =>
						onUpdate(idx, "sequenceNumber", Number(e.target.value))
					}
					className="h-8 text-xs font-mono text-center"
				/>
			</TableCell>
			<TableCell className="py-1.5 px-3">
				{isView ? (
					<span className="font-semibold">{operationName}</span>
				) : (
					<Combobox
						value={op.operationId}
						placeholder="选择工序..."
						options={formOptions.operations.map((o) => ({
							value: o.id,
							label: `${o.name} (${o.code})`,
						}))}
						onChange={(val) => onUpdate(idx, "operationId", val)}
					/>
				)}
			</TableCell>
			{/* 工序工艺规格 (1对多下拉选择，由工序维护) */}
			<TableCell className="py-1.5 px-3">
				{isView ? (
					<span className="font-medium text-xs">
						{selectedSpec?.name || "-"}
					</span>
				) : (
					<Combobox
						value={op.processingSpecificationId || ""}
						placeholder={
							specOptions.length > 0 ? "选择工序规格..." : "无可用规格"
						}
						disabled={!op.operationId || specOptions.length === 0}
						options={specOptions}
						onChange={(val) =>
							onUpdate(idx, "processingSpecificationId", val || null)
						}
					/>
				)}
			</TableCell>
			<TableCell className="py-1.5 px-3">
				<Input
					type="number"
					step="0.1"
					value={op.standardLaborHours}
					disabled={isView}
					onChange={(e) =>
						onUpdate(idx, "standardLaborHours", Number(e.target.value))
					}
					className="h-8 text-xs font-mono"
				/>
			</TableCell>
			<TableCell className="py-1.5 px-3 text-center">
				<Switch
					checked={op.qualityCheckpoint}
					disabled={isView}
					onCheckedChange={(val) => onUpdate(idx, "qualityCheckpoint", val)}
				/>
			</TableCell>
			<TableCell className="py-1.5 px-3">
				<Input
					value={op.instructionText}
					disabled={isView}
					onChange={(e) => onUpdate(idx, "instructionText", e.target.value)}
					placeholder="选择规格后自动带入加工说明，可在此修改..."
					className="h-8 text-xs"
				/>
			</TableCell>
			{!isView && (
				<TableCell className="py-1.5 px-3 text-center">
					<Button
						type="button"
						variant="ghost"
						size="icon"
						onClick={() => onRemove(idx)}
						className="size-7 text-destructive hover:bg-destructive/10"
					>
						<Trash2 className="size-3.5" />
					</Button>
				</TableCell>
			)}
		</TableRow>
	);
}

/**
 * 工艺路线清单区块积木：工序增删改、工序规格联动、标准工时、质检控制点与操作指引
 */
export function OperationRoutesSection({
	isView,
	operations,
	formOptions,
	handleAddOperation,
	handleRemoveOperation,
	handleUpdateOperation,
}: OperationRoutesSectionProps) {
	return (
		<div className="bg-card rounded-xl border shadow-xs p-4 space-y-3">
			<div className="border-b pb-1.5 flex items-center justify-between">
				<h2 className="text-sm font-bold text-foreground flex items-center gap-2">
					<Clock className="size-4 text-blue-600" /> 工序工艺路线
				</h2>
				{!isView && (
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={handleAddOperation}
						className="h-6.5 px-2 text-xs gap-1"
					>
						<Plus className="size-3" /> 添加加工工序
					</Button>
				)}
			</div>

			<div className="rounded-lg border overflow-hidden">
				<Table className="w-full text-xs">
					<TableHeader className="bg-muted/20">
						<TableRow>
							<TableHead className="py-2 px-3 w-16 font-semibold text-center">
								顺序
							</TableHead>
							<TableHead className="py-2 px-3 w-52 font-semibold">
								工序名称
							</TableHead>
							<TableHead className="py-2 px-3 w-44 font-semibold">
								工艺规格
							</TableHead>
							<TableHead className="py-2 px-3 w-28 font-semibold">
								标准工时(h)
							</TableHead>
							<TableHead className="py-2 px-3 w-24 text-center font-semibold">
								质检点
							</TableHead>
							<TableHead className="py-2 px-3 font-semibold min-w-[200px]">
								操作指引说明
							</TableHead>
							{!isView && (
								<TableHead className="py-2 px-3 text-center w-16">
									操作
								</TableHead>
							)}
						</TableRow>
					</TableHeader>
					<TableBody className="divide-y">
						{operations.length > 0 ? (
							operations.map((op, idx) => (
								<OperationTableRow
									key={idx}
									op={op}
									idx={idx}
									isView={isView}
									formOptions={formOptions}
									onUpdate={handleUpdateOperation}
									onRemove={handleRemoveOperation}
								/>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={isView ? 6 : 7}
									className="text-center py-6 text-muted-foreground text-xs"
								>
									暂无工序配置，点击上方“添加加工工序”添加工序与工序规格
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
