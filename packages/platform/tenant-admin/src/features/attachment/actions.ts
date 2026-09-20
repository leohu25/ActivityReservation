"use server";

import { defineServerAction } from "@base/shared";
import { getTenantDbContext } from "../../shared/server/tenant-context";
import { AttachmentService } from "./service";
import {
  presignedUploadSchema,
  saveAttachmentSchema,
  type PresignedUploadSchema,
  type SaveAttachmentSchema,
} from "./schema";

/**
 * 获取图片/附件直传预签名凭证 Server Action
 */
export const getUploadPresignedUrlAction = defineServerAction(
  async (input: PresignedUploadSchema) => {
    const validated = presignedUploadSchema.parse(input);
    const { organizationId } = await getTenantDbContext();

    return AttachmentService.getUploadPresignedUrl(organizationId, validated);
  },
  "获取上传授权凭证失败",
);

/**
 * 确认持久化附件记录至当前租户库 Server Action
 */
export const saveAttachmentAction = defineServerAction(
  async (input: SaveAttachmentSchema) => {
    const validated = saveAttachmentSchema.parse(input);
    const { client, userId, employeeProfile } = await getTenantDbContext();

    return AttachmentService.saveAttachment(client, validated, {
      userId,
      deptId: employeeProfile?.departmentId ?? null,
    });
  },
  "保存附件元数据失败",
);
