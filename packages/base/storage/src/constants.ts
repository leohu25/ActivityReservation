/**
 * 允许上传的常用图片 MIME 类型白名单
 * 严禁包含 image/svg+xml (SVG 内可注入恶意 JS 执行 XSS 攻击)
 */
export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export type AllowedImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];

/** 默认单张图片最大体积限制: 10MB */
export const DEFAULT_MAX_IMAGE_SIZE = 10 * 1024 * 1024;

/** 默认普通附件最大体积限制: 50MB */
export const DEFAULT_MAX_FILE_SIZE = 50 * 1024 * 1024;

/** 预签名凭证默认有效期: 10 分钟 (600 秒) */
export const DEFAULT_PRESIGN_EXPIRES_IN = 600;

/** 模块名称合法正则 (小写字母、数字、中划线，长度 2-30) */
export const MODULE_NAME_REGEX = /^[a-z0-9-]{2,30}$/;
