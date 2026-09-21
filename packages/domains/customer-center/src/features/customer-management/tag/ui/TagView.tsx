"use client";

import { useState, useMemo, useCallback } from "react";
import { MasterDataStatus, exportContractCsv } from "@base/shared";
import { useAbility } from "@base/authorization";
import {
	CustomerTagAction,
	CustomerTagField,
	customerTagPageContract,
	customerTagSearchParams,
} from "../contract";
import { Tag as TagIcon } from "lucide-react";
import {
	Badge,
	DataTable,
	DataTableInputGroup,
	Combobox,
	type ColumnDef,
	DataTableRowActions,
	useListSearch,
	toast,
} from "@base/ui";
import { updateTagStatusAction, deleteTagAction } from "../actions";
import { TagFormModal } from "./TagFormModal";
import type { CustomerTagItem, TagTypeOption } from "../types";

export interface TagViewProps {
	data: CustomerTagItem[];
	total: number;
	tagTypeOptions?: readonly TagTypeOption[] | TagTypeOption[];
}

export function TagView({ data, total, tagTypeOptions = [] }: TagViewProps) {
	const ability = useAbility();
	const list = useListSearch(customerTagSearchParams);

	const tagTypeLabelMap = useMemo(() => {
		const map: Record<string, string> = {};
		if (tagTypeOptions) {
			for (const opt of tagTypeOptions) {
				map[opt.value] = opt.label;
			}
		}
		return map;
	}, [tagTypeOptions]);

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
				() => updateTagStatusAction(id, nextStatus),
				nextStatus === MasterDataStatus.ACTIVE ? "标签已启用" : "标签已停用",
			);
		},
		[runAction],
	);

	const handleDelete = useCallback(
		async (id: string) => {
			await runAction(
				() => deleteTagAction(id),
				"标签已成功删除",
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
				[CustomerTagField.TAG_TYPE_ID]: (t) =>
					t.tagType?.name ||
					(t.tagTypeId ? tagTypeLabelMap[t.tagTypeId] || t.tagTypeId : "—"),
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
				field: CustomerTagField.TAG_TYPE_ID,
				header: "业务类型",
				width: 140,
				cell: (t: CustomerTagItem) => {
					// 优先从关联的 tagType 实体对象直接渲染（DTO 投影完备性），降级走字典选项 Map
					const label =
						t.tagType?.name ||
						(t.tagTypeId && tagTypeLabelMap[t.tagTypeId]) ||
						t.tagTypeId ||
						"—";
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
					return (
						<DataTableRowActions
							record={t}
							onView={() =>
								setModalState({
									open: true,
									mode: "view",
									record: t,
								})
							}
							onEdit={() =>
								setModalState({
									open: true,
									mode: "edit",
									record: t,
								})
							}
							onToggleStatus={() =>
								handleToggleStatus(
									t.id,
									t.status || MasterDataStatus.ACTIVE,
								)
							}
							toggleStatusOptions={{
								status: t.status,
								action: CustomerTagAction.TOGGLE_STATUS,
								confirm: (record, active) => ({
									title: `确认${active ? "停用" : "启用"}标签 "${record.name}"？`,
									description: active
										? "停用后，新建或打标客户时将不可再选用该标签。"
										: "启用后，该标签恢复正常打标使用。",
									confirmText: active ? "确认停用" : "确认启用",
									cancelText: "取消",
								}),
							}}
							onDelete={() => handleDelete(t.id)}
							deleteConfirm={{
								title: `确认删除业务标签 "${t.name}"？`,
								description: `删除后标签将彻底移除，客户关联将被解除。`,
								confirmText: "确认删除",
								cancelText: "取消",
							}}
						/>
					);
				},
			},
		],
		[handleToggleStatus, handleDelete],
	);

	return (
		<>
			<DataTable<CustomerTagItem>
				data={data}
				columns={columns}
				rowKey={(t: CustomerTagItem) => t.id}
				subject={customerTagPageContract.subject}
				title="业务标签字典"
				description="维护各业务场景策略性业务标签及打标规则。"
				total={total}
				{...list.dataTableProps}
				onCreate={() =>
					setModalState({
						open: true,
						mode: "create",
						record: null,
					})
				}
				createText="新增标签"
				onExport={handleExport}
				keywordPlaceholder="搜索标签名称、说明..."
				statusOptions={[
					{ value: MasterDataStatus.ACTIVE, label: "正常" },
					{ value: MasterDataStatus.DISABLED, label: "已停用" },
				]}
				statusValue={String(list.params.status ?? "")}
				onStatusChange={(v) => list.patch({ status: v || "" })}
				filterExtra={
					<DataTableInputGroup label="业务类型" className="w-52">
						<Combobox
							value={String(list.params.tagTypeId ?? "") || null}
							options={tagTypeOptions.map((opt) => ({
								value: opt.value,
								label: opt.label,
							}))}
							placeholder="全部类型"
							clearable={true}
							onChange={(next) =>
								list.patch({
									tagTypeId: next || "",
								})
							}
						/>
					</DataTableInputGroup>
				}
			/>

			<TagFormModal
				open={modalState.open}
				mode={modalState.mode}
				record={modalState.record}
				tagTypeOptions={tagTypeOptions}
				onClose={() =>
					setModalState({ open: false, mode: "create", record: null })
				}
				onSuccess={() =>
					setModalState({ open: false, mode: "create", record: null })
				}
			/>
		</>
	);
}
