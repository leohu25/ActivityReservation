"use client";

import { useState, useMemo, useCallback } from "react";
import {
	DataTable,
	Badge,
	DataTableRowActions,
	toast,
	useListSearch,
	type ColumnDef,
} from "@base/ui";
import { exportContractCsv, formatDate } from "@base/shared";
import { StandardAction, useAbility } from "@base/authorization";
import { updateQuoteStatusAction, deleteQuoteAction } from "../actions";
import { QuoteDetailModal } from "./QuoteDetailModal";
import { QuoteFormModal } from "./QuoteFormModal";
import {
	CustomerQuoteAction,
	CustomerQuoteField,
	CustomerQuoteStatus,
	customerQuoteSearchParams,
	quotePageContract,
} from "../contract";
import type { QuoteListItem } from "../types";

export interface QuoteViewProps {
	data: QuoteListItem[];
	total: number;
	customerOptions?: Array<{ id: string; name: string }>;
	storeOptions?: Array<{ id: string; name: string; customerId?: string }>;
}

export function QuoteView({
	data,
	total,
	customerOptions = [],
	storeOptions = [],
}: QuoteViewProps) {
	const customers = customerOptions;
	const stores = storeOptions;

	const ability = useAbility();
	const list = useListSearch(customerQuoteSearchParams);

	// 弹窗状态管理
	const [detailQuote, setDetailQuote] = useState<QuoteListItem | null>(null);
	const [formState, setFormState] = useState<{
		open: boolean;
		mode: "create" | "edit";
		record?: QuoteListItem | null;
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

	/**
	 * 审核生效 / 作废
	 */
	const handleUpdateStatus = useCallback(
		(
			id: string,
			status:
				| typeof CustomerQuoteStatus.ACTIVE
				| typeof CustomerQuoteStatus.VOIDED,
		) => {
			void runAction(
				() => updateQuoteStatusAction(id, status),
				status === CustomerQuoteStatus.ACTIVE
					? "报价单已生效"
					: "报价单已作废",
			);
		},
		[runAction],
	);

	/**
	 * 删除草稿报价单 (软删除)
	 */
	const handleDeleteQuote = useCallback(
		(id: string) => {
			void runAction(() => deleteQuoteAction(id), "草稿报价单已成功删除");
		},
		[runAction],
	);

	const handleExport = useCallback(() => {
		exportContractCsv(data, quotePageContract.configurableFields ?? [], {
			subject: quotePageContract.subject,
			ability,
			filename: `门店报价单_${new Date().toISOString().slice(0, 10)}.csv`,
			format: {
				[CustomerQuoteField.STATUS]: (q) => q.status,
			},
		});
	}, [data, ability]);

	const renderStatusBadge = useCallback((status: string) => {
		switch (status) {
			case "DRAFT":
				return (
					<Badge variant="warning" size="sm">
						草稿
					</Badge>
				);
			case "ACTIVE":
				return (
					<Badge variant="success" size="sm">
						已生效
					</Badge>
				);
			case "VOIDED":
				return (
					<Badge variant="secondary" size="sm">
						已作废
					</Badge>
				);
			case "EXPIRED":
				return (
					<Badge variant="destructive" size="sm">
						已过期
					</Badge>
				);
			default:
				return (
					<Badge variant="outline" size="sm">
						{status}
					</Badge>
				);
		}
	}, []);

	const columns: ColumnDef<QuoteListItem>[] = useMemo(
		() => [
			{
				id: "quoteNo",
				field: CustomerQuoteField.QUOTE_NO,
				header: "报价单号",
				width: 160,
				cell: (q: QuoteListItem) => (
					<span className="font-mono text-xs font-semibold text-foreground">
						{q.quoteNo}
					</span>
				),
			},
			{
				id: "displayName",
				field: CustomerQuoteField.DISPLAY_NAME,
				header: "对外简称",
				cell: (q: QuoteListItem) => (
					<div className="font-medium text-foreground">
						{q.displayName || "标准定价单"}
					</div>
				),
			},
			{
				id: "scope",
				field: CustomerQuoteField.QUOTE_TYPE,
				header: "定价适用维度",
				width: 200,
				cell: (q: QuoteListItem) => {
					if (q.storeId) {
						return (
							<div className="text-xs">
								<Badge variant="outline" size="sm" className="mb-0.5">
									门店专价
								</Badge>
								<div className="text-foreground truncate max-w-[160px]">
									{q.store?.name || q.storeId}
								</div>
							</div>
						);
					}
					if (q.customerId) {
						return (
							<div className="text-xs">
								<Badge variant="secondary" size="sm" className="mb-0.5">
									客户通用
								</Badge>
								<div className="text-foreground truncate max-w-[160px]">
									{q.customer?.name || q.customerId}
								</div>
							</div>
						);
					}
					return (
						<div className="text-xs">
							<Badge variant="warning" size="sm" className="mb-0.5">
								区域保底
							</Badge>
							<div className="font-mono text-muted-foreground">
								{q.regionCode || "全区通用"}
							</div>
						</div>
					);
				},
			},
			{
				id: "effectivePeriod",
				field: CustomerQuoteField.EFFECTIVE_DATE,
				header: "有效期范围",
				width: 170,
				cell: (q: QuoteListItem) => (
					<div className="text-xs text-muted-foreground font-mono">
						<div>自: {formatDate(q.effectiveDate)}</div>
						<div>至: {q.expiryDate ? formatDate(q.expiryDate) : "长期有效"}</div>
					</div>
				),
			},
			{
				id: "itemCount",
				header: "商品项数",
				width: 80,
				align: "center",
				cell: (q: QuoteListItem) => (
					<span className="font-mono text-xs font-semibold text-foreground">
						{q.itemCount ?? q.items?.length ?? 0}
					</span>
				),
			},
			{
				id: "status",
				field: CustomerQuoteField.STATUS,
				header: "单据状态",
				width: 90,
				align: "center",
				cell: (q: QuoteListItem) => renderStatusBadge(q.status),
			},
			{
				id: "actions",
				header: "操作",
				width: 160,
				align: "right",
				cell: (q: QuoteListItem) => (
					<DataTableRowActions
						record={q}
						onView={() => setDetailQuote(q)}
						onEdit={
							q.status === CustomerQuoteStatus.DRAFT
								? () => setFormState({ open: true, mode: "edit", record: q })
								: undefined
						}
						onDelete={
							q.status === CustomerQuoteStatus.DRAFT
								? () => handleDeleteQuote(q.id)
								: undefined
						}
						deleteConfirm={{
							title: `确认删除草稿报价单 "${q.displayName || q.quoteNo}"？`,
							description: "删除后该报价单数据将不可恢复。",
						}}
						extraActions={[
							...(q.status === CustomerQuoteStatus.DRAFT
								? [
										{
											label: "审核生效",
											action: CustomerQuoteAction.AUDIT,
											onClick: () =>
												handleUpdateStatus(q.id, CustomerQuoteStatus.ACTIVE),
											confirm: {
												title: `确认审核并生效报价单 "${q.displayName || q.quoteNo}"？`,
												description: "生效后对应维度的商品下单将立即执行此价格。",
												confirmText: "审核生效",
												cancelText: "取消",
											},
										},
									]
								: []),
							...(q.status === CustomerQuoteStatus.ACTIVE
								? [
										{
											label: "作废报价单",
											action: StandardAction.UPDATE,
											variant: "destructive" as const,
											onClick: () =>
												handleUpdateStatus(q.id, CustomerQuoteStatus.VOIDED),
											confirm: {
												title: `确认作废报价单 "${q.displayName || q.quoteNo}"？`,
												description: "作废后客户下单将不再匹配此单据定价。",
												confirmText: "确认作废",
												cancelText: "取消",
											},
										},
									]
								: []),
						]}
					/>
				),
			},
		],
		[handleDeleteQuote, handleUpdateStatus, renderStatusBadge],
	);

	return (
		<>
			<DataTable<QuoteListItem>
				data={data}
				columns={columns}
				rowKey={(q: QuoteListItem) => q.id}
				subject={quotePageContract.subject}
				title="客户阶梯价与报价单"
				description="按门店、客户、区域维护商品报价明细。报价优先级：门店专属报价 > 客户通用报价 > 区域保底报价。"
				total={total}
				{...list.dataTableProps}
				onExport={handleExport}
				onCreate={() =>
					setFormState({ open: true, mode: "create", record: null })
				}
				createText="新建报价单"
				contentProps={{ selectable: true }}
				showKeywordFilter={false}
				statusOptions={[
					{ value: "DRAFT", label: "草稿" },
					{ value: "ACTIVE", label: "已生效" },
					{ value: "VOIDED", label: "已作废" },
					{ value: "EXPIRED", label: "已过期" },
				]}
				statusValue={String(list.params.status ?? "")}
				onStatusChange={(v) => list.patch({ status: v || "" })}
			/>

			{formState.open && (
				<QuoteFormModal
					mode={formState.mode}
					record={formState.record}
					customers={customers}
					stores={stores}
					onClose={() =>
						setFormState({ open: false, mode: "create", record: null })
					}
					onSuccess={() => {
						setFormState({ open: false, mode: "create", record: null });
					}}
				/>
			)}

			<QuoteDetailModal
				open={Boolean(detailQuote)}
				quote={detailQuote}
				onClose={() => setDetailQuote(null)}
				onEdit={(q) => {
					setDetailQuote(null);
					setFormState({ open: true, mode: "edit", record: q });
				}}
			/>
		</>
	);
}
