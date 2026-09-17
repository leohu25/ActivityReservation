/**
 * @base/shared/src/utils/query/keyword-search.ts
 *
 * 关键字安全清洗工具函数
 * 遵循参数化查询安全标准，从源头杜绝控制字符污染与超长 Payload 内存攻击
 */

/**
 * 清洗搜索关键字，防止特殊不可见控制字符污染与超长 Payload
 *
 * 1. 去除首尾空白；
 * 2. 剔除 ASCII 控制字符 (0x00-0x1F, 0x7F)；
 * 3. 截断最大 100 字符，杜绝超大 payload 内存消耗。
 */
export function sanitizeSearchKeyword(raw?: unknown): string {
  if (typeof raw !== "string") return "";
  const trimmed = raw.trim();
  if (!trimmed) return "";
  // 剔除不可见控制字符
  const cleaned = trimmed.replace(/[\x00-\x1f\x7f]/g, "");
  return cleaned.slice(0, 100);
}
