import type { AppPrismaAbility, AppAbility } from "@base/authorization";
import type {
  ProcurementAction,
  ProcurementOrderField,
  ProcurementOrderStatus,
} from "./contracts";

export type ProcurementAnyAbility =
  | AppPrismaAbility<ProcurementAction, "PurchaseOrder">
  | AppAbility<ProcurementAction, "PurchaseOrder">
  | {
      can(action: string, subject: string, field?: string): boolean;
    };

/**
 * 采购订单业务展示模型 (DTO)
 */
export type ProcurementOrderFieldVisibility = Readonly<
  Record<ProcurementOrderField, boolean>
>;

export interface ProcurementOrderItem {
  readonly id: string;
  readonly orderNo?: string;
  readonly supplierName?: string;
  readonly quantity?: number;
  /** 采购成本单价；无读取权限时不返回该属性。 */
  readonly costPrice?: string;
  readonly deptId: string;
  readonly departmentName?: string | null;
  readonly createdById: string;
  readonly status?: ProcurementOrderStatus;
  readonly auditComment?: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  /** 当前用户是否有权审核本订单 (有 audit 权限 + 状态为 PENDING + 且禁止自审) */
  readonly canAuditThisOrder: boolean;
  /** 自审被拦截标识：具备审核权限但因自身为创建人被业务红线拦截 */
  readonly isSelfAuditBlocked: boolean;
}

/**
 * 创建采购订单输入契约
 */
export interface CreateOrderInput {
  readonly supplierName: string;
  readonly quantity: number;
  readonly costPrice: number | string;
}

/**
 * 创建订单的上下文身份
 */
export interface CreateOrderOperator {
  readonly userId: string;
  readonly memberId?: string;
  readonly departmentId: string;
}

/**
 * 审核采购订单输入契约
 */
export interface AuditOrderInput {
  readonly orderId: string;
  readonly action: "APPROVE" | "REJECT";
  readonly auditComment?: string;
}

/**
 * 审核订单的操作者身份
 */
export interface AuditOrderOperator {
  readonly userId: string;
  readonly memberId?: string;
}

/**
 * 导出采购订单的安全输出记录
 */
export interface ExportOrderItem {
  readonly orderNo: string;
  readonly supplierName: string;
  readonly quantity: number;
  readonly costPrice?: string;
  readonly status: string;
  readonly deptId: string;
  readonly createdById: string;
  readonly createdAt: string;
}
