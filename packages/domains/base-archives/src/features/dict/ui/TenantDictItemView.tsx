"use client";

import { useState, useMemo, useCallback } from "react";
import { MasterDataStatus, exportContractCsv } from "@base/shared";
import { useAbility } from "@base/authorization";
import {
	DICT_TYPE_OPTIONS,
	TenantDictItemAction,
	TenantDictItemField,
	tenantDictItemPageContract,
	dictItemSearchParams,
} from "../contract";
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
import {
	toggleTenantDictItemStatusAction,
	deleteTenantDictItemAction,
} from "../actions";
import { DictItemFormModal } from "./DictItemFormModal";
import type { TenantDictItemDto } from "../types";

export interface TenantDictItemViewProps {
	data: TenantDictItemDto[];
	total: number;
}

export function TenantDictItemView({ data, total }: TenantDictItemViewProps) {
	const ability = useAbility();
	const list = useListSearch(dictItemSearchParams);

	// 弹窗状态管理（支持 create / edit / view 三态）
	const [modalState, setModalState] = useState<{
		open: boolean;
		mode: "create" | "edit" | "view";
		record?: TenantDictItemDto | null;
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
				() => toggleTenantDictItemStatusAction({ id, status: nextStatus }),
				nextStatus === MasterDataStatus.ACTIVE
					? "字典项已启用"
					: "字典项已停用",
			);
		},
		[runAction],
	);

	const handleDelete = useCallback(
		async (id: string) => {
			await runAction(
				() => deleteTenantDictItemAction(id),
				"字典项已成功删除",
			);
		},
		[runAction],
	);

	const handleExport = () => {
		exportContractCsv(
			data,
			tenantDictItemPageContract.configurableFields ?? [],
			{
				subject: tenantDictItemPageContract.subject,
				ability,
				filename: `数据字典列表_${new Date().toISOString().slice(0, 10)}.csv`,
				format: {
					[TenantDictItemField.STATUS]: (item) =>
						item.status === MasterDataStatus.ACTIVE ? "启用" : "停用",
					[TenantDictItemField.IS_DEFAULT]: (item) =>
						item.isDefault ? "是" : "否",
				},
			},
		);
	};

	const columns: ColumnDef<TenantDictItemDto>[] = useMemo(
		() => [
			{
				id: "type",
				field: TenantDictItemField.TYPE,
				header: "字典类型",
				width: 180,
				lockVisible: true,
				cell: (item: TenantDictItemDto) => (
					<div className="flex flex-col">
						<span className="font-mono text-xs font-semibold text-foreground">
							{item.type}
						</span>
						<span className="text-[11px] text-muted-foreground truncate">
							{DICT_TYPE_OPTIONS.find((o) => o.value === item.type)?.label ||
								"自定义类型"}
						</span>
					</div>
				),
			},
			{
				id: "code",
				field: TenantDictItemField.CODE,
				header: "字典项编码",
				width: 140,
				cell: (item: TenantDictItemDto) => (
					<span className="font-mono text-xs font-semibold text-foreground">
						{item.code}
					</span>
				),
			},
			{
				id: "name",
				field: TenantDictItemField.NAME,
				header: "字典项名称",
				width: 180,
				cell: (item: TenantDictItemDto) => (
					<div className="flex items-center gap-1.5">
						<span className="text-xs font-medium text-foreground">
							{item.name}
						</span>
						{item.isDefault && (
							<Badge
								variant="outline"
								size="sm"
								className="text-[10px] px-1 py-0 border-primary text-primary"
							>
								默认
							</Badge>
						)}
					</div>
				),
			},
			{
				id: "sort",
				field: TenantDictItemField.SORT,
				header: "排序",
				width: 80,
				align: "center",
				cell: (item: TenantDictItemDto) => (
					<span className="font-mono text-xs text-muted-foreground">
						{item.sort}
					</span>
				),
			},
			{
				id: "status",
				field: TenantDictItemField.STATUS,
				header: "状态",
				width: 90,
				align: "center",
				cell: (item: TenantDictItemDto) => {
					const isActive = item.status === MasterDataStatus.ACTIVE;
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
				id: "remark",
				field: TenantDictItemField.REMARK,
				header: "备注说明",
				cell: (item: TenantDictItemDto) => (
					<span className="text-xs text-muted-foreground truncate max-w-[240px] block">
						{item.remark || "—"}
					</span>
				),
			},
			{
				id: "actions",
				header: "操作",
				width: 130,
				align: "right",
				cell: (item: TenantDictItemDto) => {
					return (
						<DataTableRowActions
							record={item}
							onView={() =>
								setModalState({
									open: true,
									mode: "view",
									record: item,
								})
							}
							onEdit={() =>
								setModalState({
									open: true,
									mode: "edit",
									record: item,
								})
							}
							onToggleStatus={() =>
								handleToggleStatus(
									item.id,
									item.status || MasterDataStatus.ACTIVE,
								)
							}
							toggleStatusOptions={{
								status: item.status,
								action: TenantDictItemAction.TOGGLE_STATUS,
								confirm: (record, active) => ({
									title: `确认${active ? "停用" : "启用"}字典项 "${record.name}"？`,
									description: active
										? "停用后，业务模块下拉列表中将不再显示该选项。"
										: "启用后，业务模块可正常选用该字典项。",
									confirmText: active ? "确认停用" : "确认启用",
									cancelText: "取消",
								}),
							}}
							onDelete={() => handleDelete(item.id)}
							deleteConfirm={{
								title: `确认删除字典项 "${item.name}"？`,
								description: `删除后字典项将彻底移除，可能影响历史引用数据的可读性。`,
								confirmText: "确认删除",
								cancelText: "取消",
							}}
						/>
					);
				},
			},
		],
		[handleDelete, handleToggleStatus],
	);

	return (
		<>
			<DataTable<TenantDictItemDto>
				data={data}
				columns={columns}
				rowKey={(item: TenantDictItemDto) => item.id}
				subject={tenantDictItemPageContract.subject}
				title="数据字典管理"
				description="统一维护各模块业务枚举与下拉选项，页面按 type 强类型读取与安全过滤。"
				total={total}
				{...list.dataTableProps}
				onCreate={() =>
					setModalState({
						open: true,
						mode: "create",
						record: null,
					})
				}
				createText="新增字典项"
				onExport={handleExport}
				keywordPlaceholder="搜索字典项名称、编码、类型..."
				statusOptions={[
					{ value: MasterDataStatus.ACTIVE, label: "启用" },
					{ value: MasterDataStatus.DISABLED, label: "停用" },
				]}
				statusValue={String(list.params.status ?? "")}
				onStatusChange={(v) => list.patch({ status: v || "" })}
				filterExtra={
					<DataTableInputGroup label="字典类型" className="w-56">
						<Combobox
							value={String(list.params.type ?? "") || null}
							options={[
								{ value: "", label: "全部字典类型" },
								...DICT_TYPE_OPTIONS.map((o) => ({
									value: o.value,
									label: o.label,
								})),
							]}
							placeholder="全部字典类型"
							clearable={true}
							onChange={(next) =>
								list.patch({
									type: next || "",
								})
							}
						/>
					</DataTableInputGroup>
				}
			/>

			{modalState.open && (
				<DictItemFormModal
					open={modalState.open}
					mode={modalState.mode}
					record={modalState.record}
					defaultType={String(list.params.type ?? "")}
					onClose={() =>
						setModalState({ open: false, mode: "create", record: null })
					}
					onSuccess={() =>
						setModalState({ open: false, mode: "create", record: null })
					}
				/>
			)}
		</>
	);
}
