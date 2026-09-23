"use client";

import { useState } from "react";
import { Sheet, SheetContent, Tabs, TabsList, TabsTrigger, TabsContent } from "@base/ui";
import type { BomDetailDto } from "../../types";
import { BomFlowGraph } from "../graph";
import { DetailHeader } from "./DetailHeader";
import { VersionSwitcherBar } from "./VersionSwitcherBar";
import { InputsTableTab } from "./InputsTableTab";
import { OutputsTableTab } from "./OutputsTableTab";
import { OperationsTableTab } from "./OperationsTableTab";

export interface BomDetailDrawerProps {
	readonly open: boolean;
	readonly onOpenChange: (open: boolean) => void;
	readonly detail: BomDetailDto | null;
	readonly onEdit?: (detail: BomDetailDto) => void;
	readonly onSelectVersion?: (versionNumber: number) => void;
	readonly onPublishVersion?: (bomId: string, versionNumber: number) => void;
	readonly onNavigateBom?: (bomId: string) => void;
}

/**
 * 生产 BOM 详情抽屉积木装配器：
 * 聚合头部元信息、版本切换栏、流程图谱与投入/产出/工序三大表格选项卡
 */
export function BomDetailDrawer({
	open,
	onOpenChange,
	detail,
	onEdit,
	onSelectVersion,
	onPublishVersion,
	onNavigateBom,
}: BomDetailDrawerProps) {
	const [activeTab, setActiveTab] = useState("graph");

	if (!detail) return null;

	const { currentVersion, versionHistory } = detail;
	const byProducts = currentVersion.outputs.filter(
		(o) => o.outputRole === "BYPRODUCT",
	);

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="w-[85vw] !max-w-[1400px] overflow-y-auto p-6 flex flex-col gap-0">
				{/* 1. 头部元信息积木 (内部使用 AuthGuard 声明式权限控制) */}
				<DetailHeader
					detail={detail}
					onEdit={onEdit}
					onPublishVersion={onPublishVersion}
				/>

				{/* 2. 版本切换栏积木 */}
				<VersionSwitcherBar
					currentVersionNumber={currentVersion.versionNumber}
					description={currentVersion.description}
					versionHistory={versionHistory}
					onSelectVersion={onSelectVersion}
				/>

				{/* 3. 多选项卡内容区域 */}
				<Tabs
					value={activeTab}
					onValueChange={setActiveTab}
					className="flex-1 flex flex-col"
				>
					<TabsList className="grid grid-cols-4 w-full">
						<TabsTrigger value="graph" className="text-xs">
							版本流程图谱
						</TabsTrigger>
						<TabsTrigger value="inputs" className="text-xs">
							投入清单 ({currentVersion.inputs.length})
						</TabsTrigger>
						<TabsTrigger value="outputs" className="text-xs">
							产出清单 ({currentVersion.outputs.length}
							{byProducts.length > 0 ? ` · 含${byProducts.length}副产品` : ""})
						</TabsTrigger>
						<TabsTrigger value="operations" className="text-xs">
							工艺路线 ({currentVersion.operations.length})
						</TabsTrigger>
					</TabsList>

					{/* 3.1 版本流程图谱 (积木化图谱组件) */}
					<TabsContent value="graph" className="mt-2.5 flex-1 flex flex-col">
						<BomFlowGraph detail={detail} onNavigateBom={onNavigateBom} />
					</TabsContent>

					{/* 3.2 投入清单明细表格 */}
					<TabsContent value="inputs" className="mt-4">
						<InputsTableTab inputs={currentVersion.inputs} />
					</TabsContent>

					{/* 3.3 产出清单明细表格 */}
					<TabsContent value="outputs" className="mt-4">
						<OutputsTableTab outputs={currentVersion.outputs} />
					</TabsContent>

					{/* 3.4 工艺工序路线明细表格 */}
					<TabsContent value="operations" className="mt-4">
						<OperationsTableTab operations={currentVersion.operations} />
					</TabsContent>
				</Tabs>
			</SheetContent>
		</Sheet>
	);
}
