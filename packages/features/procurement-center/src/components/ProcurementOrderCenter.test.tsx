import assert from "node:assert/strict";
import test from "node:test";
import { renderToString } from "react-dom/server";
import { ProcurementOrderStatus } from "../permissions";
import type { ProcurementOrderItem } from "../types";
import { ProcurementOrderCenter } from "./ProcurementOrderCenter";

const order: ProcurementOrderItem = {
        id: "po_hidden_fields",
        orderNo: "PO-SECRET-001",
        supplierName: "机密供应商",
        quantity: 10,
        costPrice: "¥5,000.00",
        deptId: "dept_root",
        departmentName: "采购部",
        createdById: "user_creator",
        status: ProcurementOrderStatus.PENDING,
        auditComment: "内部审核意见",
        createdAt: new Date("2026-09-09T00:00:00.000Z"),
        updatedAt: new Date("2026-09-09T00:00:00.000Z"),
        canAuditThisOrder: false,
        isSelfAuditBlocked: false,
};

test("ProcurementOrderCenter 对 HIDDEN 字段直接移除整列且不渲染掩码", () => {
        const html = renderToString(
                <ProcurementOrderCenter
                        orders={[order]}
                        sqlWhere={{ deptId: "dept_root" }}
                        activeOrgId="org_test"
                        departmentName="采购部"
                        canCreate={false}
                        canExport={false}
                        fieldVisibility={{
                                orderNo: false,
                                supplierName: false,
                                quantity: true,
                                costPrice: false,
                                status: true,
                                auditComment: false,
                        }}
                        currentUserId="user_viewer"
                />,
        );

        assert.doesNotMatch(html, /订单编号/);
        assert.doesNotMatch(html, /供应商名称/);
        assert.doesNotMatch(html, /采购单价/);
        assert.doesNotMatch(html, /审核意见/);
        assert.doesNotMatch(
                html,
                /PO-SECRET-001|机密供应商|5,000|内部审核意见|\*\*\*/,
        );
        assert.match(html, /采购数量/);
        assert.match(html, /10<!-- -->.*件/);
        assert.match(html, /状态/);
        assert.match(html, /待审核/);
});
