"use client";

import { useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MasterDataStatus, exportContractCsv } from "@base/shared";
import { useAbility } from "@base/authorization";
import {
	DataTable,
	DataTableInputGroup,
	Combobox,
	toast,
	useListSearch,
} from "@base/ui";
import {
	OperationField,
	OperationSubject,
	operationConfigurableFields,
	operationSearchParams,
} from "../contract";
import {
	deleteOperationAction,
	toggleOperationStatusAction,
} from "../actions";
import { createOperationColumns } from "./columns";
import type { OperationFormOptions, OperationListItem } from "../types";

export interface OperationListViewProps {
	readonly data: OperationListItem[];
	readonly total: number;
	readonly options: OperationFormOptions;
}

export function OperationListView({
	data,
	total,
	options,
}: OperationListViewProps) {
	const router = useRouter();
	const ability = useAbility();
	const list = useListSearch(operationSearchParams);

	const handleView = useCallback(
		(record: OperationListItem) => {
			router.push(`/production/operations/${record.id}?mode=view`);
		},
		[router],
	);

	const handleEdit = useCallback(
		(record: OperationListItem) => {
			router.push(`/production/operations/${record.id}`);
		},
		[router],
	);

	const handleDelete = useCallback(
		async (id: string) => {
			try {
				const res = await deleteOperationAction(id);
				if (res.success) {
					toast.success("工艺档案删除成功");
					router.refresh();
				} else {
					toast.error(res.error || "删除失败");
				}
			} catch (err: unknown) {
				toast.error(err instanceof Error ? err.message : "删除失败");
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
			try {
				const res = await toggleOperationStatusAction(id, nextStatus);
				if (res.success) {
					toast.success(
						nextStatus === MasterDataStatus.ACTIVE
							? "工艺档案已启用"
							: "工艺档案已停用",
					);
					router.refresh();
				} else {
					toast.error(res.error || "操作失败");
				}
			} catch (err: unknown) {
				toast.error(err instanceof Error ? err.message : "状态修改异常");
			}
		},
		[router],
	);

	const columns = useMemo(
		() =>
			createOperationColumns({
				onView: handleView,
				onEdit: handleEdit,
				onDelete: handleDelete,
				onToggleStatus: handleToggleStatus,
			}),
		[handleView, handleEdit, handleDelete, handleToggleStatus],
	);

	const handleExport = useCallback(() => {
		exportContractCsv(
			data,
			operationConfigurableFields,
			{
				subject: OperationSubject,
				ability,
				filename: `工艺档案_${new Date().toISOString().slice(0, 10)}.csv`,
				format: {
					[OperationField.DEFAULT_YIELD_RATE]: (r) =>
						r.defaultYieldRate !== null && r.defaultYieldRate !== undefined
							? `${(r.defaultYieldRate * 100).toFixed(2)}%`
							: "-",
					[OperationField.STATUS]: (r) =>
						r.status === MasterDataStatus.ACTIVE ? "正常启用" : "已停用",
				},
			},
		);
		toast.success("工艺档案导出成功");
	}, [data, ability]);

	const categoryFilterOptions = useMemo(
		() => [
			{ value: "", label: "全部分类" },
			...options.categories.map((c) => ({
				value: c.id,
				label: c.name,
			})),
		],
		[options.categories],
	);

	return (
		<DataTable<OperationListItem>
			data={data}
			columns={columns}
			rowKey={(r) => r.id}
			subject={OperationSubject}
			title="工艺主数据与规格档案"
			description="维护车间工序主技术参数及下挂的各类切配、加工规格明细。"
			total={total}
			{...list.dataTableProps}
			keywordPlaceholder="搜索工序编码、工序名称..."
			statusOptions={[
				{ value: MasterDataStatus.ACTIVE, label: "正常启用" },
				{ value: MasterDataStatus.DISABLED, label: "已停用" },
			]}
			statusValue={String(list.params.status ?? "")}
			onStatusChange={(v) => list.patch({ status: v || "" })}
			onCreate={() => router.push("/production/operations/new")}
			createText="新建工艺档案"
			onExport={handleExport}
			exportText="导出档案"
			filterExtra={
				<DataTableInputGroup label="工序分类" className="w-48">
					<Combobox
						value={String(list.params.categoryId ?? "") || null}
						options={categoryFilterOptions}
						placeholder="全部分类"
						clearable={true}
						onChange={(val) => list.patch({ categoryId: val || "" })}
					/>
				</DataTableInputGroup>
			}
		/>
	);
}
