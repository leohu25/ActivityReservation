import type { TenantPrismaClient } from "@base/db-tenant";
import { generatePresignedUploadUrl } from "@base/storage";
import type { PresignedUploadSchema, SaveAttachmentSchema } from "./schema";

export class AttachmentService {
  /**
   * 生成租户隔离的 S3/MinIO 直传预签名凭证
   */
  static async getUploadPresignedUrl(
    tenantId: string,
    input: PresignedUploadSchema,
  ) {
    return generatePresignedUploadUrl({
      tenantId,
      module: input.module,
      fileName: input.fileName,
      mimeType: input.mimeType,
      fileSize: input.fileSize,
    });
  }

  /**
   * 确认并持久化附件记录至当前租户库
   */
  static async saveAttachment(
    client: TenantPrismaClient,
    input: SaveAttachmentSchema,
    auditCtx?: { userId: string; deptId: string | null },
  ) {
    const record = await client.attachment.create({
      data: {
        module: input.module,
        targetId: input.targetId,
        fieldKey: input.fieldKey,
        fileName: input.fileName,
        storageKey: input.storageKey,
        fileUrl: input.fileUrl,
        fileSize: BigInt(input.fileSize),
        mimeType: input.mimeType,
        createdById: auditCtx?.userId || "system",
        deptId: auditCtx?.deptId,
      },
    });

    return {
      id: record.id,
      fileUrl: record.fileUrl,
      fileName: record.fileName,
      storageKey: record.storageKey,
    };
  }

  /**
   * 按业务对象批量查询附件列表
   */
  static async listAttachments(
    client: TenantPrismaClient,
    module: string,
    targetId: string,
  ) {
    return client.attachment.findMany({
      where: {
        module,
        targetId,
        isDeleted: false,
      },
      orderBy: { createdAt: "desc" },
    });
  }
}
