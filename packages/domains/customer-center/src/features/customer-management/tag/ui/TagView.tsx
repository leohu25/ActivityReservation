"use client";

import { useState, useMemo, useCallback } from "react";
import { MasterDataStatus, exportContractCsv } from "@base/shared";
import { StandardAction, useAbility } from "@base/authorization";
import {
	CustomerTagField,
	CustomerTagSubject,
	customerTagPageContract,
	customerTagSearchParams,
} from "../contract";
import { Tag as TagIcon } from "lucide-react";
import {
	Badge,
	DataTable,
	type ColumnDef,
	DataTableRowActions,
	useListSearch,
	toast,
	useSafeRouter,
} from "@base/ui";
import { updateTagStatusAction, deleteTagAction } from "../actions";
import { TagFormModal } from "./TagFormModal";
import type { CustomerTagItem } from "../types";

export interface TagViewProps {
	data: CustomerTagItem[];
	total: number;
}

const tagTypeLabels: Record<string, string> = {
	DELIVERY: "配送策略",
	SETTLEMENT: "结算方式",
	CREDIT: "信用分级",
	OTHER: "其他通用",
};

/**
 * 业务标签管理视图：纯单实体标准视图
 * - URL / 列表搜索由 useListSearch + customerTagSearchParams 自动驱动
 * - 按钮（查询、重置、刷新、导出、新增）100% 由 DataTable 模板组件生成
 */
export function TagView({ data, total }: TagViewProps) {
	const ability = useAbility();
	const router = useSafeRouter();
	const list = useListSearch(customerTagSearchParams);

	// CASL 权限位收敛（Fail-Closed）
	const canCreate = ability.can(StandardAction.CREATE, CustomerTagSubject);
	const canUpdate = ability.can(StandardAction.UPDATE, CustomerTagSubject);
	const canDelete = ability.can(StandardAction.DELETE, CustomerTagSubject);

	// 弹窗状态管理（支持 create / edit / view 三态）
	const [modalState, setModalState] = useState<{
		open: boolean;
		mode: "create" | "edit" | "view";
		record?: CustomerTagItem | null;
	}>({ open: false, mode: "create", record: null });

	const runAction = useCallback(
		async (
			fn: () => Promise<{ success: boolean; error?: string }>,
			successText: string,
			fallbackError: string,
		) => {
			try {
				const res = await fn();
				if (res.success) {
					toast.success(successText);
					router?.refresh();
					return true;
				} else {
					toast.error(res.error || fallbackError);
					return false;
				}
			} catch (err: unknown) {
				toast.error(err instanceof Error ? err.message : "操作异常");
				return false;
			}
		},
		[router],
	);

	const handleToggleStatus = useCallback(
		async (id: string, currentStatus: string) => {
			const nextStatus =
				currentStatus === MasterDataStatus.ACTIVE
					? MasterDataStatus.DISABLED
					: MasterDataStatus.ACTIVE;
			await runAction(
				() => updateTagStatusAction(id, nextStatus),
				nextStatus === MasterDataStatus.ACTIVE ? "标签已启用" : "标签已停用",
				"变更标签状态失败",
			);
		},
		[runAction],
	);

	const handleDelete = useCallback(
		async (id: string) => {
			await runAction(
				() => deleteTagAction(id),
				"标签已成功删除",
				"删除标签失败",
			);
		},
		[runAction],
	);

	const handleExport = () => {
		exportContractCsv(data, customerTagPageContract.configurableFields ?? [], {
			subject: customerTagPageContract.subject,
			ability,
			filename: `客户标签字典_${new Date().toISOString().slice(0, 10)}.csv`,
			format: {
				[CustomerTagField.TAG_TYPE]: (t) =>
					tagTypeLabels[t.tagType ?? "OTHER"] || t.tagType || "OTHER",
				[CustomerTagField.STATUS]: (t) =>
					t.status === MasterDataStatus.ACTIVE ? "启用" : "停用",
			},
		});
	};

	const columns: ColumnDef<CustomerTagItem>[] = useMemo(
		() => [
			{
				id: "name",
				field: CustomerTagField.NAME,
				header: "标签名称",
				width: 180,
				lockVisible: true,
				cell: (t: CustomerTagItem) => (
					<div className="flex items-center gap-1.5 font-medium text-foreground text-xs">
						<TagIcon className="size-3.5 text-primary/70 shrink-0" />
						<span>{t.name}</span>
					</div>
				),
			},
			{
				id: "tagType",
				field: CustomerTagField.TAG_TYPE,
				header: "业务类型",
				width: 140,
				cell: (t: CustomerTagItem) => {
					const typeKey = t.tagType || "OTHER";
					const label = tagTypeLabels[typeKey] || typeKey;
					return (
						<Badge
							variant="secondary"
							size="sm"
							className="font-normal text-[11px]"
						>
							{label}
						</Badge>
					);
				},
			},
			{
				id: "description",
				field: CustomerTagField.DESCRIPTION,
				header: "业务描述说明",
				cell: (t: CustomerTagItem) => (
					<span className="text-xs text-muted-foreground truncate max-w-[260px] block">
						{t.description || "—"}
					</span>
				),
			},
			{
				id: "status",
				field: CustomerTagField.STATUS,
				header: "状态",
				width: 90,
				align: "center",
				cell: (t: CustomerTagItem) => {
					const isActive = t.status === MasterDataStatus.ACTIVE;
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
				width: 130,
				align: "right",
				cell: (t: CustomerTagItem) => {
					const isActive = t.status === MasterDataStatus.ACTIVE;
					const rowActions = (
						<DataTableRowActions
							record={t}
							onView={() =>
								setModalState({
									open: true,
									mode: "view",
									record: t,
								})
							}
							onEdit={
								canUpdate
									? () =>
											setModalState({
												open: true,
												mode: "edit",
												record: t,
											})
									: undefined
							}
							onDelete={canDelete ? () => handleDelete(t.id) : undefined}
							deleteConfirm={{
								title: `确认删除业务标签 "${t.name}"？`,
								description: `删除后标签将彻底移除，客户关联将被解除。`,
								confirmText: "确认删除",
								cancelText: "取消",
							}}
							extraActions={
								canUpdate
									? [
											{
												label: isActive ? "停用" : "启用",
												action: StandardAction.UPDATE,
												variant: isActive
													? ("destructive" as const)
													: ("default" as const),
												confirm: {
													title: `确认${isActive ? "停用" : "启用"}标签 "${t.name}"？`,
													description: isActive
														? "停用后，新建或打标客户时将不可再选用该标签。"
														: "启用后，该标签恢复正常打标使用。",
													confirmText: isActive ? "确认停用" : "确认启用",
													cancelText: "取消",
												},
												onClick: () =>
													handleToggleStatus(
														t.id,
														t.status || MasterDataStatus.ACTIVE,
													),
											},
										]
									: []
							}
						/>
					);

					return canDelete ? (
						<span
							title="删除标签"
							className="inline-flex items-center justify-end"
						>
							{rowActions}
						</span>
					) : (
						<div className="inline-flex items-center justify-end">
							{rowActions}
						</div>
					);
				},
			},
		],
		[canUpdate, canDelete, handleToggleStatus, handleDelete],
	);

	return (
		<>
			<DataTable<CustomerTagItem>
				data={data}
				columns={columns}
				rowKey={(t: CustomerTagItem) => t.id}
				subject={customerTagPageContract.subject}
				title="业务标签字典"
				description="维护配送策略、结算方式、信用分级等策略性业务标签。"
				total={total}
				{...list.dataTableProps}
				onCreate={
					canCreate
						? () =>
								setModalState({
									open: true,
									mode: "create",
									record: null,
								})
						: undefined
				}
				createText="新增标签"
				onExport={handleExport}
				keywordPlaceholder="搜索标签名称、说明..."
				statusOptions={[
					{ value: "DELIVERY", label: "配送策略" },
					{ value: "SETTLEMENT", label: "结算方式" },
					{ value: "CREDIT", label: "信用分级" },
					{ value: "OTHER", label: "其他通用" },
				]}
				statusValue={String(list.params.tagType ?? "")}
				statusAllLabel="全部业务类型"
				onStatusChange={(v) => list.patch({ tagType: v || "" })}
			/>

			{modalState.open && (
				<TagFormModal
					mode={modalState.mode}
					record={modalState.record}
					onClose={() =>
						setModalState({ open: false, mode: "create", record: null })
					}
					onSuccess={() => {
						setModalState({ open: false, mode: "create", record: null });
						router?.refresh();
					}}
				/>
			)}
		</>
	);
}
