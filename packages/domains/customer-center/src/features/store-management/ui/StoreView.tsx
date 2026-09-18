"use client";

import React, { useState, useEffect } from "react";
import { Building2 } from "lucide-react";
import {
	DataTable,
	DataTableInputGroup,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Badge,
	DataTableRowActions,
	toast,
	useListUrlNav,
	type ColumnDef,
	type FormModalMode,
} from "@base/ui";
import { exportContractCsv, MasterDataStatus } from "@base/shared";
import { useAbility } from "@base/authorization";
import { updateStoreStatusAction, deleteStoreAction } from "../actions";
import { StoreFormModal } from "./StoreFormModal";
import { CustomerStoreField, storePageContract } from "../contract";
import type { StoreListItem } from "../types";
import type { CustomerListItem } from "../../customer-management/types";

/**
 * 门店档案列表页面入参属性契约
 */
interface Props {
	/** 初始门店列表数据集（服务端当前页） */
	initialStores: StoreListItem[];
	/** 服务端总条数 */
	initialTotal?: number;
	initialPage?: number;
	initialPageSize?: number;
	initialKeyword?: string;
	initialCustomer?: string;
	initialStatus?: string;
	/** 可选客户关联字典列表 */
	customers: CustomerListItem[];
}

/**
 * 客户中心 - 门店档案管理工作台
 * 遵循现代数智工业风规范，全面接入 BusinessTableWorkspace 标准表格体系
 */
export function StoreView({
	initialStores,
	initialTotal,
	initialPage = 1,
	initialPageSize = 10,
	initialKeyword = "",
	initialCustomer = "",
	initialStatus = "",
	customers,
}: Props) {
	const ability = useAbility();
	const { navigateList, router } = useListUrlNav();
	const [stores, setStores] = useState<StoreListItem[]>(initialStores);
	const [total, setTotal] = useState(initialTotal ?? initialStores.length);
	const [page, setPage] = useState(initialPage);
	const [pageSize, setPageSize] = useState(initialPageSize);

	useEffect(() => {
		setStores(initialStores);
		setTotal(initialTotal ?? initialStores.length);
		setPage(initialPage);
		setPageSize(initialPageSize);
	}, [initialStores, initialTotal, initialPage, initialPageSize]);
	const [keyword, setKeyword] = useState(initialKeyword);
	const [selectedCust, setSelectedCust] = useState(initialCustomer);
	const [selectedStatus, setSelectedStatus] = useState(initialStatus);
	const [, setLoading] = useState(false);

	const [modalState, setModalState] = useState<{
		open: boolean;
		mode: FormModalMode;
		record?: StoreListItem | null;
	}>({
		open: false,
		mode: "create",
		record: null,
	});

	/**
	 * 切换门店启用/停用状态
	 */
	const handleToggleStatus = async (
		id: string,
		currentStatus: MasterDataStatus | string,
	) => {
		setLoading(true);
		const nextStatus =
			currentStatus === MasterDataStatus.ACTIVE
				? MasterDataStatus.DISABLED
				: MasterDataStatus.ACTIVE;
		try {
			const res = await updateStoreStatusAction(id, nextStatus);
			if (res.success) {
				setStores((prev) =>
					prev.map((item) =>
						item.id === id ? { ...item, status: nextStatus } : item,
					),
				);
				toast.success(
					nextStatus === MasterDataStatus.ACTIVE ? "门店已启用" : "门店已停用",
				);
				router?.refresh();
			} else {
				toast.error(res.error || "变更门店状态失败");
			}
		} catch (err: unknown) {
			toast.error(err instanceof Error ? err.message : "变更状态异常");
		} finally {
			setLoading(false);
		}
	};

	/**
	 * 删除指定门店
	 */
	const handleDelete = async (id: string) => {
		setLoading(true);
		try {
			const res = await deleteStoreAction(id);
			if (res.success) {
				setStores((prev) => prev.filter((item) => item.id !== id));
				toast.success("门店已成功删除");
				router?.refresh();
			} else {
				toast.error(res.error || "删除失败");
			}
		} catch (err: unknown) {
			toast.error(err instanceof Error ? err.message : "删除操作异常");
		} finally {
			setLoading(false);
		}
	};

	const handleExport = () => {
		exportContractCsv(stores, storePageContract.configurableFields ?? [], {
			subject: storePageContract.subject,
			ability,
			filename: `门店档案_${new Date().toISOString().slice(0, 10)}.csv`,
			format: {
				[CustomerStoreField.STATUS]: (s) =>
					s.status === MasterDataStatus.ACTIVE ? "正常" : "已停用",
			},
		});
	};

	// 配送时段语义化字典映射
	const deliveryPeriodLabels: Record<string, string> = {
		MORNING: "早间配送 (05:00-08:00)",
		NOON: "午间配送 (10:00-12:00)",
		EVENING: "傍晚配送 (15:00-18:00)",
	};

	/**
	 * 标准表格列定义（强类型化，无 any 逃逸）
	 */
	const columns: ColumnDef<StoreListItem>[] = [
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
							? deliveryPeriodLabels[s.deliveryPeriod] || s.deliveryPeriod
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
					extraActions={[
						{
							label:
								s.status === MasterDataStatus.ACTIVE ? "停用门店" : "启用门店",
							variant:
								s.status === MasterDataStatus.ACTIVE
									? "destructive"
									: "default",
							onClick: () => handleToggleStatus(s.id, s.status),
							confirm:
								s.status === MasterDataStatus.ACTIVE
									? {
											title: `确认停用门店 "${s.name}"？`,
											description: "停用后该门店将无法继续下单或关联配送调度。",
											confirmText: "确认停用",
											cancelText: "取消",
										}
									: undefined,
						},
					]}
					onDelete={() => handleDelete(s.id)}
					deleteConfirm={{
						title: `确认删除门店 "${s.name}"？`,
						description: "删除后该履约门店的信息将无法恢复。",
					}}
				/>
			),
		},
	];

	return (
		<>
			<DataTable
				data={stores}
				columns={columns}
				rowKey={(s: StoreListItem) => s.id}
				subject={storePageContract.subject}
				title="门店档案"
				description="门店是订单订货、物流配送、现场签收与对账的最小履约单元，必须归属于有效客户并绑定区域。"
				page={page}
				pageSize={pageSize}
				total={total}
				onPageChange={(nextPage, nextPageSize) => {
					setPage(nextPage);
					setPageSize(nextPageSize);
					navigateList({
						page: nextPage,
						pageSize: nextPageSize,
						keyword: keyword.trim() || undefined,
						customer: selectedCust || undefined,
						status: selectedStatus || undefined,
					});
				}}
				onRefresh={() => router?.refresh()}
				onExport={handleExport}
				onCreate={() =>
					setModalState({ open: true, mode: "create", record: null })
				}
				contentProps={{ selectable: true }}
				keywordPlaceholder="搜索门店名称、地址、联系人、客户..."
				keywordValue={keyword}
				onKeywordChange={setKeyword}
				statusOptions={[
					{ value: MasterDataStatus.ACTIVE, label: "正常" },
					{ value: MasterDataStatus.DISABLED, label: "已停用" },
				]}
				statusValue={selectedStatus}
				onStatusChange={(v) => {
					setSelectedStatus(v);
					setPage(1);
					navigateList({
						page: 1,
						pageSize,
						keyword: keyword.trim() || undefined,
						customer: selectedCust || undefined,
						status: v || undefined,
					});
				}}
				filterExtra={
					<DataTableInputGroup label="所属客户" className="w-52">
						<Select
							value={selectedCust || "ALL"}
							onValueChange={(v) => {
								const next = !v || v === "ALL" ? "" : v;
								setSelectedCust(next);
								setPage(1);
								navigateList({
									page: 1,
									pageSize,
									keyword: keyword.trim() || undefined,
									customer: next || undefined,
									status: selectedStatus || undefined,
								});
							}}
						>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="全部" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="ALL">全部</SelectItem>
								{customers.map((c) => (
									<SelectItem key={c.id} value={c.id}>
										{c.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</DataTableInputGroup>
				}
				onSearch={() => {
					setPage(1);
					navigateList({
						page: 1,
						pageSize,
						keyword: keyword.trim() || undefined,
						customer: selectedCust || undefined,
						status: selectedStatus || undefined,
					});
				}}
				onReset={() => {
					setKeyword("");
					setSelectedCust("");
					setSelectedStatus("");
					setPage(1);
					navigateList({
						page: 1,
						pageSize,
						keyword: undefined,
						customer: undefined,
						status: undefined,
					});
				}}
			>
				<StoreFormModal
					open={modalState.open}
					mode={modalState.mode}
					record={modalState.record}
					customers={customers}
					onClose={() =>
						setModalState({ open: false, mode: "create", record: null })
					}
					onSuccess={() => {
						setModalState({ open: false, mode: "create", record: null });
						router?.refresh();
					}}
				/>
			</DataTable>
		</>
	);
}
