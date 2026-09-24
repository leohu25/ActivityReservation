/**
 * 附件实体标识与权限常量 (SSoT)
 */
import {
  StandardAction,
  type FeaturePagePermissionDescriptor,
} from "@base/authorization";

export const AttachmentSubject = "Attachment";
export type AttachmentSubject = typeof AttachmentSubject;

export const AttachmentResource = "system.attachment";
export type AttachmentResource = typeof AttachmentResource;

export const attachmentPageContract: FeaturePagePermissionDescriptor = {
  resource: AttachmentResource,
  subject: AttachmentSubject,
  label: "附件管理",
  path: "/settings/attachments",
  actions: [
    { action: StandardAction.READ, label: "查看附件" },
    { action: StandardAction.CREATE, label: "上传附件" },
    { action: StandardAction.DELETE, label: "删除附件" },
  ],
};
