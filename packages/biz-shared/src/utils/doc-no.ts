/**
 * 业务流水单号 / 编码格式化与校验工具
 */
export function formatBusinessDocNo(
 prefix: string,
 sequence: number | string,
 date: Date = new Date(),
): string {
 const yyyymmdd = date.toISOString().slice(0, 10).replace(/-/g, "");
 const paddedSeq = String(sequence).padStart(4, "0");
 return `${prefix}-${yyyymmdd}-${paddedSeq}`;
}
