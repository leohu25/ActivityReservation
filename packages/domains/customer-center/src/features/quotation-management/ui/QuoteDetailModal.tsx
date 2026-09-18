"use client";

import { useMemo } from "react";
import {
	Badge,
	FormModal,
	type DetailTableColumn,
	type FormModalSection,
} from "@base/ui";
import { MapPin, Layers } from "lucide-react";
import { formatDate } from "@base/shared";
import type { QuoteListItem, QuoteItemDetail } from "../types";

export interface QuoteDetailModalProps {
	open: boolean;
	quote: QuoteListItem | null;
	onClose: () => void;
	onEdit?: (quote: QuoteListItem) => void;
}

export function QuoteDetailModal({
	open,
	quote,
	onClose,
	onEdit,
}: QuoteDetailModalProps) {
	const columns: DetailTableColumn<QuoteItemDetail>[] = useMemo(
		() => [
			{
				id: "itemCode",
				header: "商品编码",
				renderCell: (item) => (
					<span className="text-muted-foreground font-mono">
						{item.itemCode}
					</span>
				),
			},
			{
				id: "itemName",
				header: "商品名称",
				renderCell: (item) => (
					<span className="font-medium text-foreground">{item.itemName}</span>
				),
			},
			{
				id: "salesUnit",
				header: "销售单位",
				align: "center",
				renderCell: (item) => <span>{item.salesUnit}</span>,
			},
			{
				id: "unitPriceExclTax",
				header: "去税单价",
				align: "right",
				renderCell: (item) => (
					<span className="font-mono tabular-nums text-foreground">
						¥{Number(item.unitPriceExclTax).toFixed(2)}
					</span>
				),
			},
			{
				id: "taxRate",
				header: "税率",
				align: "right",
				renderCell: (item) => (
					<span className="font-mono tabular-nums text-muted-foreground">
						{Number(item.taxRate)}%
					</span>
				),
			},
			{
				id: "unitPriceInclTax",
				header: "含税单价",
				align: "right",
				renderCell: (item) => (
					<span className="font-mono tabular-nums font-semibold text-primary">
						¥{Number(item.unitPriceInclTax).toFixed(2)}
					</span>
				),
			},
			{
				id: "qtyRange",
				header: "阶梯起订量",
				align: "center",
				renderCell: (item) => {
					if (!item.minQty && !item.maxQty) {
						return <span className="text-muted-foreground text-xs">不限</span>;
					}
					const minText = String(item.minQty ?? 0);
					const maxText = String(item.maxQty ?? "∞");
					return (
						<span className="text-xs font-mono">
							{minText} ~ {maxText}
						</span>
					);
				},
			},
			{
				id: "remark",
				header: "备注",
				renderCell: (item) => (
					<span className="text-xs text-muted-foreground">
						{item.remark || "-"}
					</span>
				),
			},
		],
		[],
	);

	if (!quote) return null;

	const renderStatusBadge = (status: string) => {
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
	};

	const renderScopeInfo = () => {
		if (quote.storeId) {
			return (
				<span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
					<MapPin className="size-3.5" />
					【门店专价】
					{quote.store?.name || quote.storeId}
				</span>
			);
		}
		if (quote.customerId) {
			return (
				<span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
					<Layers className="size-3.5" />
					【客户通用】
					{quote.customer?.name || quote.customerId}
				</span>
			);
		}
		return (
			<span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
				<MapPin className="size-3.5" />
				【区域通用】{quote.regionCode || "未指定"}
			</span>
		);
	};

	const renderDate = (dateVal?: string | Date | null) => {
		if (!dateVal) return "长期有效";
		return formatDate(dateVal);
	};

	const sections: FormModalSection[] = [
		{
			title: "基本属性与适用范围",
			columns: 4,
			fields: [
				{
					name: "quoteNo",
					label: "报价单号",
					type: "custom",
					render: () => (
						<span className="font-mono font-semibold text-foreground text-xs">
							{quote.quoteNo}
						</span>
					),
				},
				{
					name: "scope",
					label: "定价适用维度",
					type: "custom",
					render: () => renderScopeInfo(),
				},
				{
					name: "dates",
					label: "价格有效期",
					type: "custom",
					render: () => (
						<span className="font-mono text-foreground text-xs">
							{renderDate(quote.effectiveDate)} ~ {renderDate(quote.expiryDate)}
						</span>
					),
				},
				{
					name: "createdBy",
					label: "创建人",
					type: "custom",
					render: () => (
						<span className="text-foreground text-xs">
							{quote.createdBy || "系统管理员"}
						</span>
					),
				},
			],
		},
	];

	return (
		<FormModal<Record<string, unknown>, QuoteItemDetail>
			open={open}
			onClose={onClose}
			mode="view"
			badge="QD"
			title={
				<div className="flex items-center gap-3">
					<span className="font-semibold text-base text-foreground">
						{quote.displayName || "报价单详情"}
					</span>
					<span className="font-mono text-xs text-muted-foreground font-normal">
						({quote.quoteNo})
					</span>
					{renderStatusBadge(quote.status)}
				</div>
			}
			description="查看报价单适用范围、明细商品与阶梯含税单价"
			className="max-w-5xl sm:max-w-5xl"
			sections={sections}
			initialValues={{}}
			detailConfig={{
				title: "商品明细清单",
				columns,
				minRows: 0,
			}}
			initialItems={quote.items || []}
			extraActions={
				quote.status === "DRAFT" && onEdit
					? [
							{
								key: "edit",
								label: "编辑此单据",
								onClick: () => {
									onClose();
									onEdit(quote);
								},
							},
						]
					: undefined
			}
		/>
	);
}
