import crypto from "node:crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getS3Client, getStorageConfig } from "./client";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  DEFAULT_MAX_FILE_SIZE,
  DEFAULT_PRESIGN_EXPIRES_IN,
  MODULE_NAME_REGEX,
} from "./constants";
import type {
  PresignedUploadRequest,
  PresignedUploadResult,
  StorageConfig,
} from "./types";

/**
 * 构造严格符合多租户沙箱隔离规范的存储路径 Key
 * 规范格式: tenants/{tenantId}/{module}/{yyyy}/{mm}/{randomId}.{ext}
 */
export function buildTenantStorageKey(
  tenantId: string,
  module: string,
  fileName: string,
): string {
  const cleanTenant = tenantId.trim().replace(/[^a-zA-Z0-9_-]/g, "");
  if (!cleanTenant) {
    throw new Error("租户标识无效，无法生成隔离存储路径");
  }

  const cleanModule = module.trim().toLowerCase();
  if (!MODULE_NAME_REGEX.test(cleanModule)) {
    throw new Error(
      `模块标识 [${module}] 不合法，仅支持 2-30 位的英文字母、数字和中划线`,
    );
  }

  // 提取并清洗扩展名
  const parts = fileName.split(".");
  const rawExt = parts.length > 1 ? parts.pop() || "" : "";
  const cleanExt = rawExt.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!cleanExt) {
    throw new Error("文件缺少合法的扩展名");
  }

  // 严禁恶意脚本扩展名
  const forbiddenExts = ["svg", "html", "htm", "exe", "sh", "bat", "js", "mjs", "php", "jsp"];
  if (forbiddenExts.includes(cleanExt)) {
    throw new Error(`系统安全策略禁止上传 .${cleanExt} 格式的文件`);
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const randomId = crypto.randomUUID().replace(/-/g, "");

  return `tenants/${cleanTenant}/${cleanModule}/${year}/${month}/${randomId}.${cleanExt}`;
}

/**
 * 计算公开访问/下载时的完整 URL
 */
export function computePublicFileUrl(
  config: StorageConfig,
  storageKey: string,
): string {
  const cleanDomain = config.publicDomain.replace(/\/+$/, "");
  if (config.forcePathStyle) {
    return `${cleanDomain}/${config.bucket}/${storageKey}`;
  }
  return `${cleanDomain}/${storageKey}`;
}

/**
 * 生成带有租户隔离与时效性约束的直传预签名凭证 (Presigned URL)
 */
export async function generatePresignedUploadUrl(
  params: PresignedUploadRequest,
  customConfig?: StorageConfig,
): Promise<PresignedUploadResult> {
  const config = customConfig || getStorageConfig();

  // 1. 校验大小
  const maxAllowedSize = DEFAULT_MAX_FILE_SIZE;
  if (params.fileSize <= 0 || params.fileSize > maxAllowedSize) {
    throw new Error(
      `文件体积 (${(params.fileSize / 1024 / 1024).toFixed(1)}MB) 超出允许范围 (最大支持 ${maxAllowedSize / 1024 / 1024}MB)`,
    );
  }

  // 2. 校验 MIME 类型
  if (!params.mimeType || params.mimeType === "image/svg+xml") {
    throw new Error("文件类型不合法或安全策略拦截");
  }

  // 3. 构建租户隔离路径
  const storageKey = buildTenantStorageKey(
    params.tenantId,
    params.module,
    params.fileName,
  );

  const expiresIn = params.expiresInSeconds || DEFAULT_PRESIGN_EXPIRES_IN;
  const client = getS3Client(config);

  // 4. 构建 PutObject 指令并预签名
  const command = new PutObjectCommand({
    Bucket: config.bucket,
    Key: storageKey,
    ContentType: params.mimeType,
  });

  const uploadUrl = await getSignedUrl(client, command, {
    expiresIn,
  });

  const fileUrl = computePublicFileUrl(config, storageKey);

  return {
    uploadUrl,
    fileUrl,
    storageKey,
    expiresIn,
  };
}
