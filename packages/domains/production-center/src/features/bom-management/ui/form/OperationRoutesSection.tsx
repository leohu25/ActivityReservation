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
	const operationName =
		formOptions.operations.find((o) => o.id === op.operationId)?.name ||
		op.operationId;

	return (
		<TableRow>
			<TableCell className="p-3 text-center">
				<Input
					type="number"
					value={op.sequenceNumber}
					disabled={isView}
					onChange={(e) =>
						onUpdate(idx, "sequenceNumber", Number(e.target.value))
					}
					className="h-9 text-xs font-mono text-center"
				/>
			</TableCell>
			<TableCell className="p-3">
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
			<TableCell className="p-3">
				<Input
					type="number"
					step="0.1"
					value={op.standardLaborHours}
					disabled={isView}
					onChange={(e) =>
						onUpdate(idx, "standardLaborHours", Number(e.target.value))
					}
					className="h-9 text-xs font-mono"
				/>
			</TableCell>
			<TableCell className="p-3 text-center">
				<Switch
					checked={op.qualityCheckpoint}
					disabled={isView}
					onCheckedChange={(val) => onUpdate(idx, "qualityCheckpoint", val)}
				/>
			</TableCell>
			<TableCell className="p-3">
				<Input
					value={op.instructionText}
					disabled={isView}
					onChange={(e) => onUpdate(idx, "instructionText", e.target.value)}
					placeholder="输入具体工序指导与规范说明..."
					className="h-9 text-xs"
				/>
			</TableCell>
			{!isView && (
				<TableCell className="p-3 text-center">
					<Button
						type="button"
						variant="ghost"
						size="icon"
						onClick={() => onRemove(idx)}
						className="size-8 text-destructive hover:bg-destructive/10"
					>
						<Trash2 className="size-4" />
					</Button>
				</TableCell>
			)}
		</TableRow>
	);
}

/**
 * 工艺路线清单区块积木：工序增删改、工序顺序号、标准工时、质检控制点与操作指引
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
							<TableHead className="py-3 px-4 w-20 font-semibold text-center">
								顺序
							</TableHead>
							<TableHead className="py-3 px-4 w-64 font-semibold">
								工序名称
							</TableHead>
							<TableHead className="py-3 px-4 w-32 font-semibold">
								标准工时(h)
							</TableHead>
							<TableHead className="py-3 px-4 w-28 text-center font-semibold">
								质检控制点
							</TableHead>
							<TableHead className="py-3 px-4 font-semibold">
								操作指引说明
							</TableHead>
							{!isView && (
								<TableHead className="py-3 px-4 text-center w-16">
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
									colSpan={isView ? 5 : 6}
									className="text-center py-8 text-muted-foreground text-xs"
								>
									暂无工序配置，点击上方按钮添加第一道加工工序
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
