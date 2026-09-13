import { z } from "zod";

/**
 * 业务单据流转通用审批状态常量对象与类型
 */
export const BizApprovalStatus = {
 DRAFT: "DRAFT",
 PENDING: "PENDING",
 APPROVED: "APPROVED",
 REJECTED: "REJECTED",
 CANCELLED: "CANCELLED",
} as const;

export type BizApprovalStatus =
 (typeof BizApprovalStatus)[keyof typeof BizApprovalStatus];

/**
 * 通用单据审批操作输入契约 (Zod Schema)
 */
export const bizAuditActionSchema = z.object({
 action: z.enum(["APPROVE", "REJECT"]),
 comment: z.string().max(500, "审核意见最多不超过 500 字").optional(),
});

export type BizAuditActionInput = z.infer<typeof bizAuditActionSchema>;
