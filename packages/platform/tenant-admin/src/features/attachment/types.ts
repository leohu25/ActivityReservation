/**
 * 通用附件信息模型
 */
export interface AttachmentItem {
  readonly id: string;
  readonly module: string;
  readonly targetId: string | null;
  readonly fieldKey: string | null;
  readonly fileName: string;
  readonly storageKey: string;
  readonly fileUrl: string;
  readonly fileSize: number;
  readonly mimeType: string;
  readonly createdAt: Date;
}

/**
 * 预签名上传请求参数
 */
export interface PresignedUploadInput {
  readonly module: string;
  readonly fileName: string;
  readonly fileSize: number;
  readonly mimeType: string;
}

/**
 * 持久化附件记录输入参数
 */
export interface SaveAttachmentInput {
  readonly module: string;
  readonly targetId?: string | null;
  readonly fieldKey?: string | null;
  readonly fileName: string;
  readonly storageKey: string;
  readonly fileUrl: string;
  readonly fileSize: number;
  readonly mimeType: string;
}
