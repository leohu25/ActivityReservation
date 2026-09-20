import { z } from "@base/ui";
import { ALLOWED_IMAGE_MIME_TYPES, DEFAULT_MAX_FILE_SIZE } from "@base/storage";

/** 附件实体与权限 Subject (SSoT) */
export const AttachmentSubject = "Attachment";
export type AttachmentSubject = typeof AttachmentSubject;
export const AttachmentResource = "system.attachment";
export type AttachmentResource = typeof AttachmentResource;

/**
 * 获取直传预签名 URL 参数 Schema (SSoT)
 */
export const presignedUploadSchema = z.object({
  module: z
    .string()
    .min(2, "模块标识至少2位字符")
    .max(30, "模块标识最多30位字符")
    .regex(/^[a-z0-9-]+$/, "模块标识仅支持小写字母、数字与中划线"),
  fileName: z
    .string()
    .min(1, "文件名不能为空")
    .max(255, "文件名过长"),
  fileSize: z
    .number()
    .positive("文件大小必须大于0")
    .max(DEFAULT_MAX_FILE_SIZE, `文件体积超出上限`),
  mimeType: z
    .string()
    .refine(
      (type) => (ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(type),
      "只允许上传常见图片格式 (JPG/PNG/WEBP/GIF)，禁止上传 SVG 或可执行文件",
    ),
});

export type PresignedUploadSchema = z.infer<typeof presignedUploadSchema>;

/**
 * 记录通用附件入库参数 Schema
 */
export const saveAttachmentSchema = z.object({
  module: z.string().min(1),
  targetId: z.string().optional().nullable().default(null),
  fieldKey: z.string().optional().nullable().default(null),
  fileName: z.string().min(1),
  storageKey: z.string().min(1),
  fileUrl: z.string().min(1),
  fileSize: z.number().nonnegative(),
  mimeType: z.string().min(1),
});

export type SaveAttachmentSchema = z.infer<typeof saveAttachmentSchema>;
