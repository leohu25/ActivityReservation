/**
 * 审计日志领域模型接口 (SSoT)
 */

export interface AuditOperationLogItem {
  readonly id: string;
  readonly operatorId: string;
  readonly operatorName: string;
  readonly action: string;
  readonly resource: string;
  readonly targetId?: string | null;
  readonly ipAddress?: string | null;
  readonly createdAt: Date;
}

export interface AuditLoginLogItem {
  readonly id: string;
  readonly userId: string;
  readonly email: string;
  readonly ipAddress: string;
  readonly userAgent?: string | null;
  readonly status: "SUCCESS" | "FAILED";
  readonly createdAt: Date;
}

export interface ListAuditLogsFilter {
  readonly page?: number;
  readonly pageSize?: number;
  readonly search?: string;
  readonly startDate?: string;
  readonly endDate?: string;
}
