import crypto from "node:crypto";

/**
 * 迁移版本号对比工具函数 (按自然字典序比较时间戳或版本语义化字符串)
 * 返回值：a > b 返回正数，a < b 返回负数，相等返回 0
 */
export function compareMigrationVersions(a: string, b: string): number {
 return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

/**
 * 计算 SQL 文本或文件内容的 SHA-256 摘要哈希（用于防篡改校验）
 */
export function computeSha256(content: string): string {
 return crypto.createHash("sha256").update(content, "utf8").digest("hex");
}

/**
 * 解析迁移目录命名规范：<版本号/时间戳>_<迁移名称>
 * 例如: "202609080001_initial_tenant_schema" -> { version: "202609080001", name: "initial_tenant_schema" }
 */
export function parseMigrationFolderName(
 folderName: string,
): { version: string; name: string } | null {
 const match = folderName.match(
  /^([0-9]{8,14}|v?[0-9]+\.[0-9]+\.[0-9]+)_(.+)$/,
 );
 if (!match) return null;
 return {
  version: match[1],
  name: match[2],
 };
}
