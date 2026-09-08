"use client";

import React, { useState } from "react";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    Badge,
    Button,
} from "@chenrun/ui";
import {
    PackageCheck,
    CheckCheck,
    Code2,
    ShieldCheck,
    Building2,
    AlertCircle,
    FileSpreadsheet,
} from "lucide-react";
import type { ProcurementOrderItem, ProcurementAnyAbility } from "../types";
import { CreateOrderDialog } from "./CreateOrderDialog";
import { AuditOrderModal } from "./AuditOrderModal";

export interface ProcurementOrderCenterProps {
    readonly orders: readonly ProcurementOrderItem[];
    readonly sqlWhere: Record<string, unknown>;
    readonly activeOrgId: string;
    readonly departmentName?: string | null;
    readonly canCreate: boolean;
    readonly canAuditGlobal: boolean;
    readonly canExport: boolean;
    readonly isCostPriceVisible: boolean;
    readonly currentUserId: string;
    readonly ability?: ProcurementAnyAbility;
    readonly createFieldModes?: Record<
        string,
        "EDITABLE" | "READONLY" | "HIDDEN"
    >;
}

export function ProcurementOrderCenter({
    orders,
    sqlWhere,
    activeOrgId,
    departmentName,
    canCreate,
    canAuditGlobal,
    canExport,
    isCostPriceVisible,
    ability,
    createFieldModes,
}: ProcurementOrderCenterProps) {
    const [selectedAuditOrder, setSelectedAuditOrder] =
        useState<ProcurementOrderItem | null>(null);

    const handleExportDummy = () => {
        alert(
            "采购数据导出遵循当前角色字段脱敏策略，成本价将依权决定是否包含在导出文件中。",
        );
    };

    return (
        <div className="space-y-6">
            {/* 顶部操作与标题栏 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5 dark:border-slate-800">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                            采购订单中心
                        </h1>
                        <Badge variant="default" size="sm">
                            <PackageCheck className="size-3 mr-1" />
                            <span>CASL 动态守卫 + 物理库直连</span>
                        </Badge>
                    </div>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        按钮依权限展示、敏感成本价依字段策略控制、查询结果遵循
                        PostgreSQL 动态数据范围下推，审核执行【禁止自审】红线。
                    </p>
                </div>

                {/* 权限受控操作按钮组 */}
                <div className="flex items-center gap-2.5">
                    {canExport && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExportDummy}
                            className="text-slate-600 hover:text-slate-900 dark:text-slate-300"
                        >
                            <FileSpreadsheet className="size-3.5 mr-1" />
                            <span>导出订单</span>
                        </Button>
                    )}

                    {canCreate && (
                        <CreateOrderDialog
                            ability={ability}
                            fieldModes={createFieldModes}
                            departmentName={departmentName}
                        />
                    )}
                </div>
            </div>

            {/* 实时下推与字段权限说明看板 */}
            <Card className="border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                            <ShieldCheck className="size-3.5 text-blue-600" />
                            <span>Prisma accessibleBy 实时下推查询条件</span>
                        </CardTitle>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                            <Building2 className="size-3" />
                            <span>当前租户: {activeOrgId}</span>
                        </div>
                    </div>
                    <CardDescription>
                        根据当前登录成员在当前租户库关联的部门树拓扑，自动下推
                        SQL WHERE 隔离过滤：
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-xl bg-slate-900 p-3 font-mono text-xs text-emerald-400 overflow-x-auto dark:bg-slate-950 border border-slate-800">
                        <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-slate-800 text-[10px] text-slate-500">
                            <Code2 className="size-3" />
                            <span>
                                {
                                    "// Generated Prisma Where Clause via CASL Data Scope"
                                }
                            </span>
                        </div>
                        <pre className="leading-relaxed">
                            {JSON.stringify(sqlWhere, null, 2)}
                        </pre>
                    </div>
                </CardContent>
            </Card>

            {/* 业务订单表格 (遵循现代轻量 SaaS 表格规范) */}
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-200/80 bg-slate-50/80 text-slate-500 dark:border-slate-800 dark:bg-slate-800/60">
                        <tr>
                            <th className="px-5 py-3 font-bold">订单编号</th>
                            <th className="px-5 py-3 font-bold">供应商名称</th>
                            <th className="px-5 py-3 font-bold">采购数量</th>
                            <th className="px-5 py-3 font-bold">
                                采购单价 (敏感资产)
                            </th>
                            <th className="px-5 py-3 font-bold">归属部门</th>
                            <th className="px-5 py-3 font-bold">状态</th>
                            <th className="px-5 py-3 font-bold">审核意见</th>
                            <th className="px-5 py-3 font-bold text-right">
                                操作
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {orders.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={8}
                                    className="px-5 py-8 text-center text-slate-400"
                                >
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <AlertCircle className="size-6 text-slate-300" />
                                        <span>
                                            当前数据范围内暂无采购订单，可点击右上角新建订单
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            orders.map((order) => (
                                <tr
                                    key={order.id}
                                    className="hover:bg-blue-50/30 dark:hover:bg-slate-800/50 transition-colors"
                                >
                                    <td className="px-5 py-3.5 font-mono font-bold text-slate-900 dark:text-slate-100">
                                        {order.orderNo}
                                    </td>
                                    <td className="px-5 py-3.5 font-medium text-slate-800 dark:text-slate-200">
                                        {order.supplierName}
                                    </td>
                                    <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400 tabular-nums">
                                        {order.quantity} 件
                                    </td>
                                    <td className="px-5 py-3.5">
                                        {order.isCostPriceMasked ? (
                                            <span className="text-slate-400 italic font-mono text-[11px]">
                                                *** (已依据字段策略脱敏)
                                            </span>
                                        ) : (
                                            <span className="font-bold text-emerald-600 tabular-nums dark:text-emerald-400">
                                                {order.costPrice}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400">
                                        {order.departmentName || order.deptId}
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <Badge
                                            variant={
                                                order.status === "APPROVED"
                                                    ? "success"
                                                    : order.status ===
                                                        "REJECTED"
                                                      ? "destructive"
                                                      : "warning"
                                            }
                                            size="sm"
                                        >
                                            {order.status === "APPROVED"
                                                ? "已通过"
                                                : order.status === "REJECTED"
                                                  ? "已驳回"
                                                  : "待审核"}
                                        </Badge>
                                    </td>
                                    <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">
                                        {order.auditComment || "-"}
                                    </td>
                                    <td className="px-5 py-3.5 text-right">
                                        {order.canAuditThisOrder ? (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    setSelectedAuditOrder(order)
                                                }
                                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-bold dark:text-blue-400"
                                            >
                                                <CheckCheck className="size-3.5 mr-1" />
                                                <span>审批</span>
                                            </Button>
                                        ) : order.isSelfAuditBlocked ? (
                                            <span
                                                title="您是本单据创建人，依据内控规范禁止自审"
                                                className="inline-flex items-center text-[11px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 dark:bg-amber-950/40 dark:border-amber-900/50 dark:text-amber-400 cursor-help"
                                            >
                                                禁止自审
                                            </span>
                                        ) : (
                                            <span className="text-slate-400 text-xs">
                                                -
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {selectedAuditOrder && (
                <AuditOrderModal
                    order={selectedAuditOrder}
                    isOpen={true}
                    onClose={() => setSelectedAuditOrder(null)}
                />
            )}
        </div>
    );
}
