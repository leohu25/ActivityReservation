"use client";

import { useState, useMemo, useCallback } from "react";
import { Building2 } from "lucide-react";
import {
	DataTable,
	DataTableInputGroup,
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Badge,
	DataTableRowActions,
	toast,
	useListSearch,
	type ColumnDef,
	type FormModalMode,
} from "@base/ui";
import { exportContractCsv, MasterDataStatus } from "@base/shared";
import { useAbility } from "@base/authorization";
import { updateStoreStatusAction, deleteStoreAction } from "../actions";
import { StoreFormModal } from "./StoreFormModal";
import {
	CustomerStoreAction,
	CustomerStoreField,
	customerStoreSearchParams,
	storePageContract,
} from "../contract";
import type { StoreListItem } from "../types";
import type { CustomerListItem } from "../../customer-management/types";

/**
 * 门店档案列表页面入参属性契约 (SSoT)
 */
export interface StoreViewProps {
	/** 门店列表数据集（服务端当前页） */
	data: StoreListItem[];
	/** 服务端总条数 */
	total: number;
	/** 可选客户关联字典列表 */
	customerOptions?: Array<{ id: string; name: string }>;
}

// 配送时段语义化字典映射
const DELIVERY_PERIOD_LABELS: Record<string, string> = {
	MORNING: "早间配送 (05:00-08:00)",
	NOON: "午间配送 (10:00-12:00)",
	EVENING: "傍晚配送 (15:00-18:00)",
};

/**
 * 客户中心 - 门店档案管理工作台
 * 遵循现代数智工业风规范，基于 DataTable 与 URL-as-State (nuqs) 驱动
 */
export function StoreView({
	data,
	total,
	customerOptions = [],
}: StoreViewProps) {
	const customers = customerOptions as CustomerListItem[];

	const ability = useAbility();
	const list = useListSearch(customerStoreSearchParams);

	const [modalState, setModalState] = useState<{
		open: boolean;
		mode: FormModalMode;
		record?: StoreListItem | null;
	}>({
		open: false,
		mode: "create",
		record: null,
	});

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

	/**
	 * 切换门店启用/停用状态
	 */
	const handleToggleStatus = useCallback(
		(id: string, currentStatus: MasterDataStatus | string) => {
			const nextStatus =
				currentStatus === MasterDataStatus.ACTIVE
					? MasterDataStatus.DISABLED
					: MasterDataStatus.ACTIVE;
			void runAction(
				() => updateStoreStatusAction(id, nextStatus),
				nextStatus === MasterDataStatus.ACTIVE ? "门店已启用" : "门店已停用",
			);
		},
		[runAction],
	);

	/**
	 * 删除指定门店
	 */
	const handleDelete = useCallback(
		(id: string) => {
			void runAction(() => deleteStoreAction(id), "门店已成功删除");
		},
		[runAction],
	);

	const handleExport = useCallback(() => {
		exportContractCsv(data, storePageContract.configurableFields ?? [], {
			subject: storePageContract.subject,
			ability,
			filename: `门店档案_${new Date().toISOString().slice(0, 10)}.csv`,
			format: {
				[CustomerStoreField.STATUS]: (s) =>
					s.status === MasterDataStatus.ACTIVE ? "正常" : "已停用",
			},
		});
	}, [data, ability]);

	/**
	 * 标准表格列定义（强类型化，无 any 逃逸）
	 */
	const columns: ColumnDef<StoreListItem>[] = useMemo(
		() => [
			{
				id: "name",
				field: CustomerStoreField.NAME,
				header: "门店名称",
				cell: (s: StoreListItem) => (
					<div className="font-medium text-foreground">{s.name}</div>
				),
			},
			{
				id: "customer",
				field: CustomerStoreField.CUSTOMER_ID,
				header: "所属客户",
				width: 170,
				cell: (s: StoreListItem) => (
					<div className="flex items-center gap-1.5 text-xs text-foreground">
						<Building2 className="size-3.5 text-muted-foreground shrink-0" />
						<span className="truncate">{s.customer?.name || s.customerId}</span>
					</div>
				),
			},
			{
				id: "regionDelivery",
				field: CustomerStoreField.REGION_CODE,
				header: "区域 / 配送时段",
				width: 180,
				cell: (s: StoreListItem) => (
					<div className="text-xs">
						<div className="font-mono text-muted-foreground">{s.regionCode}</div>
						<div className="text-foreground mt-0.5">
							{s.deliveryPeriod
								? DELIVERY_PERIOD_LABELS[s.deliveryPeriod] || s.deliveryPeriod
								: "默认时段"}
						</div>
					</div>
				),
			},
			{
				id: "address",
				field: CustomerStoreField.ADDRESS,
				header: "配送收货地址",
				cell: (s: StoreListItem) => (
					<div
						className="text-xs text-muted-foreground max-w-xs truncate"
						title={s.address}
					>
						{s.address}
					</div>
				),
			},
			{
				id: "contact",
				field: CustomerStoreField.CONTACT_PHONE,
				header: "门店联系人",
				width: 150,
				cell: (s: StoreListItem) => (
					<div className="text-xs">
						<div className="font-medium text-foreground">{s.contactPerson}</div>
						<div className="text-muted-foreground font-mono">
							{s.contactPhone}
						</div>
					</div>
				),
			},
			{
				id: "status",
				field: CustomerStoreField.STATUS,
				header: "状态",
				width: 90,
				align: "center",
				cell: (s: StoreListItem) => (
					<Badge
						variant={
							s.status === MasterDataStatus.ACTIVE ? "success" : "secondary"
						}
						size="sm"
					>
						{s.status === MasterDataStatus.ACTIVE ? "正常" : "已停用"}
					</Badge>
				),
			},
			{
				id: "actions",
				header: "操作",
				width: 140,
				align: "right",
				cell: (s: StoreListItem) => (
					<DataTableRowActions
						record={s}
						onView={() => setModalState({ open: true, mode: "view", record: s })}
						onEdit={() => setModalState({ open: true, mode: "edit", record: s })}
						onToggleStatus={() => handleToggleStatus(s.id, s.status)}
						toggleStatusOptions={{
							status: s.status,
							action: CustomerStoreAction.TOGGLE_STATUS,
							activeLabel: "停用门店",
							inactiveLabel: "启用门店",
							confirm: (record, active) =>
								active
									? {
											title: `确认停用门店 "${record.name}"？`,
											description: "停用后该门店将无法继续下单或关联配送调度。",
											confirmText: "确认停用",
											cancelText: "取消",
										}
									: undefined,
						}}
						onDelete={() => handleDelete(s.id)}
						deleteConfirm={{
							title: `确认删除门店 "${s.name}"？`,
							description: "删除后该履约门店的信息将无法恢复。",
						}}
					/>
				),
			},
		],
		[handleDelete, handleToggleStatus],
	);

	return (
		<>
			<DataTable<StoreListItem>
				data={data}
				columns={columns}
				rowKey={(s: StoreListItem) => s.id}
				subject={storePageContract.subject}
				title="门店档案"
				description="门店是订单订货、物流配送、现场签收与对账的最小履约单元，必须归属于有效客户并绑定区域。"
				total={total}
				{...list.dataTableProps}
				onExport={handleExport}
				onCreate={() =>
					setModalState({ open: true, mode: "create", record: null })
				}
				createText="新增"
				contentProps={{ selectable: true }}
				keywordPlaceholder="搜索门店名称、地址、联系人、客户..."
				statusOptions={[
					{ value: MasterDataStatus.ACTIVE, label: "正常" },
					{ value: MasterDataStatus.DISABLED, label: "已停用" },
				]}
				statusValue={String(list.params.status ?? "")}
				onStatusChange={(v) => list.patch({ status: v || "" })}
				filterExtra={
					<DataTableInputGroup label="所属客户" className="w-52">
						<Select
							value={String(list.params.customerId || "ALL")}
							onValueChange={(v) =>
								list.patch({
									customerId: !v || v === "ALL" ? "" : v,
								})
							}
						>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="全部" />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									<SelectItem value="ALL">全部</SelectItem>
									{customers.map((c) => (
										<SelectItem key={c.id} value={c.id}>
											{c.name}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>
					</DataTableInputGroup>
				}
			/>

			<StoreFormModal
				open={modalState.open}
				mode={modalState.mode}
				record={modalState.record}
				customers={customers}
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
