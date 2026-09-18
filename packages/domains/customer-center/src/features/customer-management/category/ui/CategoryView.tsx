"use client";

import { useState, useMemo, useCallback } from "react";
import { MasterDataStatus, exportContractCsv } from "@base/shared";
import { StandardAction, useAbility } from "@base/authorization";
import {
	CustomerCategoryAction,
	CustomerCategoryField,
	customerCategoryPageContract,
	customerCategorySearchParams,
} from "../contract";
import { Plus, Folder, CornerDownRight } from "lucide-react";
import {
	Badge,
	DataTable,
	type ColumnDef,
	DataTableRowActions,
	useListSearch,
	toast,
} from "@base/ui";
import { updateCategoryStatusAction, deleteCategoryAction } from "../actions";
import { CategoryFormModal } from "./CategoryFormModal";
import type { CustomerCategoryItem } from "../types";

export interface CategoryViewProps {
	data: CustomerCategoryItem[];
	total: number;
	categoryOptions?: CustomerCategoryItem[];
}

/**
 * 客户分类管理视图：纯单实体标准视图
 * - URL / 列表搜索由 useListSearch + customerCategorySearchParams 自动驱动
 * - 按钮（查询、重置、刷新、导出、新增）100% 由 DataTable 模板组件生成
 */
export function CategoryView({
	data,
	total,
	categoryOptions = [],
}: CategoryViewProps) {
	const ability = useAbility();
	const list = useListSearch(customerCategorySearchParams);

	// 弹窗状态管理（支持 create / edit / view 三态）
	const [modalState, setModalState] = useState<{
		open: boolean;
		mode: "create" | "edit" | "view";
		record?: CustomerCategoryItem | null;
		defaultParentId?: string | null;
	}>({ open: false, mode: "create", record: null, defaultParentId: null });

	const categoryMap = useMemo(() => {
		const map = new Map<string, string>();
		for (const c of categoryOptions.length > 0 ? categoryOptions : data) {
			map.set(c.id, c.name);
		}
		return map;
	}, [categoryOptions, data]);

	const runAction = useCallback(
		async (
			fn: () => Promise<{ success: boolean; error?: string }>,
			successText: string,
		) => {
			try {
				const res = await fn();
				if (res.success) {
					toast.success(successText);
				} else {
					toast.error(res.error || "操作失败");
				}
			} catch (err: unknown) {
				toast.error(err instanceof Error ? err.message : "操作异常");
			}
		},
		[],
	);

	const handleToggleStatus = useCallback(
		async (id: string, currentStatus: string) => {
			const nextStatus =
				currentStatus === MasterDataStatus.ACTIVE
					? MasterDataStatus.DISABLED
					: MasterDataStatus.ACTIVE;
			await runAction(
				() => updateCategoryStatusAction(id, nextStatus),
				nextStatus === MasterDataStatus.ACTIVE ? "分类已启用" : "分类已停用",
			);
		},
		[runAction],
	);

	const handleDelete = useCallback(
		async (id: string) => {
			await runAction(
				() => deleteCategoryAction(id),
				"分类已成功删除",
			);
		},
		[runAction],
	);

	const handleExport = () => {
		exportContractCsv(
			data,
			customerCategoryPageContract.configurableFields ?? [],
			{
				subject: customerCategoryPageContract.subject,
				ability,
				filename: `客户分类主数据_${new Date().toISOString().slice(0, 10)}.csv`,
				format: {
					[CustomerCategoryField.STATUS]: (c) =>
						c.status === MasterDataStatus.ACTIVE ? "启用" : "停用",
				},
			},
		);
	};

	const columns: ColumnDef<CustomerCategoryItem>[] = useMemo(
		() => [
			{
				id: "name",
				field: CustomerCategoryField.NAME,
				header: "分类名称",
				width: 260,
				lockVisible: true,
				cell: (c: CustomerCategoryItem) => (
					<div className="flex items-center gap-1.5 py-0.5">
						{c.parentId ? (
							<CornerDownRight className="size-3.5 text-muted-foreground/70 shrink-0 select-none" />
						) : (
							<Folder className="size-3.5 text-primary/70 shrink-0 select-none" />
						)}
						<span className="font-medium text-foreground text-xs">
							{c.name}
						</span>
						{!c.parentId && (
							<Badge
								variant="outline"
								size="sm"
								className="text-[10px] h-4 px-1 text-muted-foreground"
							>
								根分类
							</Badge>
						)}
					</div>
				),
			},
			{
				id: "parentId",
				field: CustomerCategoryField.PARENT_ID,
				header: "上级分类归属",
				width: 180,
				cell: (c: CustomerCategoryItem) => {
					const parentName = c.parentId ? categoryMap.get(c.parentId) : null;
					return (
						<span className="text-xs text-muted-foreground">
							{c.parentId ? (
								<Badge
									variant="secondary"
									size="sm"
									className="font-normal text-[11px]"
								>
									{parentName || c.parentId}
								</Badge>
							) : (
								<span className="text-muted-foreground/50">— 一级根节点 —</span>
							)}
						</span>
					);
				},
			},
			{
				id: "description",
				field: CustomerCategoryField.DESCRIPTION,
				header: "业务描述说明",
				cell: (c: CustomerCategoryItem) => (
					<span className="text-xs text-muted-foreground truncate max-w-[260px] block">
						{c.description || "—"}
					</span>
				),
			},
			{
				id: "status",
				field: CustomerCategoryField.STATUS,
				header: "状态",
				width: 90,
				align: "center",
				cell: (c: CustomerCategoryItem) => {
					const isActive = c.status === MasterDataStatus.ACTIVE;
					return (
						<Badge
							variant={isActive ? "success" : "secondary"}
							size="sm"
							className="text-[11px]"
						>
							{isActive ? "启用" : "停用"}
						</Badge>
					);
				},
			},
			{
				id: "actions",
				header: "操作",
				width: 170,
				align: "right",
				cell: (c: CustomerCategoryItem) => {
					const isActive = c.status === MasterDataStatus.ACTIVE;
					return (
						<DataTableRowActions
							record={c}
							onView={() =>
								setModalState({
									open: true,
									mode: "view",
									record: c,
									defaultParentId: null,
								})
							}
							onEdit={() =>
								setModalState({
									open: true,
									mode: "edit",
									record: c,
									defaultParentId: null,
								})
							}
							extraActions={[
								{
									label: "下级",
									action: StandardAction.CREATE,
									icon: <Plus className="size-3" />,
									onClick: () =>
										setModalState({
											open: true,
											mode: "create",
											record: null,
											defaultParentId: c.id,
										}),
								},
								{
									label: isActive ? "停用" : "启用",
									action: CustomerCategoryAction.TOGGLE_STATUS,
									variant: isActive
										? ("destructive" as const)
										: ("default" as const),
									confirm: {
										title: `确认${isActive ? "停用" : "启用"}分类 "${c.name}"？`,
										description: isActive
											? "停用后，该分类在新建/修改客户时将不再可选。"
											: "启用后，该分类可在客户档案中正常选择使用。",
										confirmText: isActive ? "确认停用" : "确认启用",
										cancelText: "取消",
									},
									onClick: () =>
										handleToggleStatus(c.id, c.status || "ACTIVE"),
								},
							]}
							onDelete={() => handleDelete(c.id)}
							deleteConfirm={{
								title: `确认删除分类 "${c.name}"？`,
								description:
									"删除后该分类将彻底移除。若该分类下存在子级分类或有关联客户档案，系统将自动拦截并禁止删除。",
								confirmText: "确认删除",
								cancelText: "取消",
							}}
						/>
					);
				},
			},
		],
		[categoryMap, handleToggleStatus, handleDelete],
	);

	return (
		<>
			<DataTable<CustomerCategoryItem>
				data={data}
				columns={columns}
				rowKey={(c: CustomerCategoryItem) => c.id}
				subject={customerCategoryPageContract.subject}
				title="客户分类管理"
				description="按行业与业态构建客户分类体系与层级归属，支持快速延伸下级节点。"
				total={total}
				{...list.dataTableProps}
				onCreate={() =>
					setModalState({
						open: true,
						mode: "create",
						record: null,
						defaultParentId: null,
					})
				}
				createText="新增一级根分类"
				onExport={handleExport}
				keywordPlaceholder="搜索分类名称、描述..."
				statusOptions={[
					{ value: MasterDataStatus.ACTIVE, label: "正常" },
					{ value: MasterDataStatus.DISABLED, label: "已停用" },
				]}
				statusValue={String(list.params.status ?? "")}
				onStatusChange={(v) => list.patch({ status: v || "" })}
			/>

			<CategoryFormModal
				open={modalState.open}
				mode={modalState.mode}
				record={modalState.record}
				defaultParentId={modalState.defaultParentId}
				categories={categoryOptions.length > 0 ? categoryOptions : data}
				onClose={() =>
					setModalState({
						open: false,
						mode: "create",
						record: null,
						defaultParentId: null,
					})
				}
				onSuccess={() =>
					setModalState({
						open: false,
						mode: "create",
						record: null,
						defaultParentId: null,
					})
				}
			/>
		</>
	);
}
