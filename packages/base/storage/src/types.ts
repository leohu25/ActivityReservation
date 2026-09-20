/**
 * 对象存储配置模型 (S3 兼容规范)
 */
export interface StorageConfig {
  /** 服务端 S3 Endpoint (如 http://127.0.0.1:9000 或 https://oss-cn-hangzhou.aliyuncs.com) */
  readonly endpoint: string;
  /** 存储桶所在地域 (MinIO 可为 us-east-1 或 auto) */
  readonly region: string;
  /** 存储桶名称 */
  readonly bucket: string;
  /** Access Key ID */
  readonly accessKeyId: string;
  /** Secret Access Key */
  readonly secretAccessKey: string;
  /**
   * 是否强制使用路径样式 (Path-Style)
   * MinIO 本地部署必须为 true，阿里云 OSS / AWS S3 生产环境通常为 false
   */
  readonly forcePathStyle: boolean;
  /**
   * 浏览器访问/预览文件时的公开基准域名
   * 如 http://127.0.0.1:9000 或 https://cdn.yourcompany.com
   */
  readonly publicDomain: string;
}

/**
 * 获取直传预签名 URL 请求参数
 */
export interface PresignedUploadRequest {
  /** 当前租户 ID (强制多租户路径物理隔离) */
  readonly tenantId: string;
  /** 业务模块标识 (如 employee, customer, bom 等) */
  readonly module: string;
  /** 原始文件名 (带扩展名) */
  readonly fileName: string;
  /** 文件的 MIME 类型 (必须在白名单内) */
  readonly mimeType: string;
  /** 文件字节大小 */
  readonly fileSize: number;
  /** 预签名凭证有效期 (秒)，默认 600 秒 (10分钟) */
  readonly expiresInSeconds?: number;
}

/**
 * 直传预签名凭证返回结果
 */
export interface PresignedUploadResult {
  /** 浏览器直接向对象存储发起 HTTP PUT 的授权 URL */
  readonly uploadUrl: string;
  /** 上传成功后文件的公开/持久化访问 URL */
  readonly fileUrl: string;
  /** 对象在存储桶中的内部 Key (如 tenants/{tenantId}/...) */
  readonly storageKey: string;
  /** 凭证过期时间戳 (秒) */
  readonly expiresIn: number;
}
