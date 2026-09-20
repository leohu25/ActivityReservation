"use server";

import { defineServerAction } from "@base/shared";
import { generatePresignedUploadUrl } from "@base/storage";
import { getTenantDbContext } from "../../shared/server/tenant-context";
import {
  presignedUploadSchema,
  saveAttachmentSchema,
  type PresignedUploadSchema,
  type SaveAttachmentSchema,
} from "./contract";

/**
 * 获取图片/附件直传预签名凭证 Server Action
 */
export const getUploadPresignedUrlAction = defineServerAction(
  async (input: PresignedUploadSchema) => {
    const validated = presignedUploadSchema.parse(input);
    const { organizationId } = await getTenantDbContext();

    return generatePresignedUploadUrl({
      tenantId: organizationId,
      module: validated.module,
      fileName: validated.fileName,
      mimeType: validated.mimeType,
      fileSize: validated.fileSize,
    });
  },
  "获取上传授权凭证失败",
);

/**
 * 确认持久化附件记录至当前租户库
 */
export const saveAttachmentAction = defineServerAction(
  async (input: SaveAttachmentSchema) => {
    const validated = saveAttachmentSchema.parse(input);
    const { client } = await getTenantDbContext();

    const record = await client.attachment.create({
      data: {
        module: validated.module,
        targetId: validated.targetId,
        fieldKey: validated.fieldKey,
        fileName: validated.fileName,
        storageKey: validated.storageKey,
        fileUrl: validated.fileUrl,
        fileSize: BigInt(validated.fileSize),
        mimeType: validated.mimeType,
      },
    });

    return {
      id: record.id,
      fileUrl: record.fileUrl,
      fileName: record.fileName,
      storageKey: record.storageKey,
    };
  },
  "保存附件元数据失败",
);
