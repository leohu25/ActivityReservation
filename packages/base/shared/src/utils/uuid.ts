import { uuidv7 } from "uuidv7";

/**
 * 生成符合 RFC 9562 规范的 128 位、按时间有序的 UUID v7
 *
 * 核心指标：
 * 1. 128 位二进制 / 16 字节物理存储（PostgreSQL 原生 `uuid` 类型）；
 * 2. 毫秒时间戳前缀单调递增，聚簇索引性能与写入吞吐最优；
 * 3. 标准 36 字符连字符 Hex 表达。
 */
export function generateUuidV7(): string {
  return uuidv7();
}

/**
 * 校验字符串是否为合法的 UUID v7 格式
 */
export function isUuidV7(val: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    val,
  );
}
