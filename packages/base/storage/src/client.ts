import { S3Client } from "@aws-sdk/client-s3";
import type { StorageConfig } from "./types";

/**
 * 解析并获取当前运行时的对象存储配置
 * 优先读取环境变量，针对本地未配置场景提供安全优雅的 MinIO 兜底
 */
export function getStorageConfig(): StorageConfig {
  const endpoint =
    process.env.STORAGE_ENDPOINT || "http://127.0.0.1:9000";
  const region = process.env.STORAGE_REGION || "us-east-1";
  const bucket = process.env.STORAGE_BUCKET || "saas-storage-local";
  const accessKeyId = process.env.STORAGE_ACCESS_KEY_ID || "minioadmin";
  const secretAccessKey =
    process.env.STORAGE_SECRET_ACCESS_KEY || "minioadmin";
  const forcePathStyle =
    process.env.STORAGE_FORCE_PATH_STYLE !== "false"; // 默认开启 PathStyle (MinIO)
  const publicDomain =
    process.env.STORAGE_PUBLIC_DOMAIN || endpoint;

  return {
    endpoint,
    region,
    bucket,
    accessKeyId,
    secretAccessKey,
    forcePathStyle,
    publicDomain,
  };
}

let cachedClient: S3Client | null = null;
let lastClientKey: string | null = null;

/**
 * 获取或创建 S3Client 单例
 */
export function getS3Client(customConfig?: StorageConfig): S3Client {
  const config = customConfig || getStorageConfig();
  const cacheKey = `${config.endpoint}#${config.region}#${config.accessKeyId}#${config.forcePathStyle}`;

  if (cachedClient && lastClientKey === cacheKey) {
    return cachedClient;
  }

  const client = new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    forcePathStyle: config.forcePathStyle,
  });

  cachedClient = client;
  lastClientKey = cacheKey;

  return client;
}
