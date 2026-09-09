/**
 * @chenrun/shared - 企业级数值、货币、日期与容量格式化工具
 */

export interface FormatCurrencyOptions {
 /** 货币符号，默认为 "¥" */
 readonly symbol?: string;
 /** 保留小数位数，默认为 2 */
 readonly decimals?: number;
 /** 是否在货币符号与金额之间保留空格，默认为 true */
 readonly space?: boolean;
}

/**
 * 格式化货币金额 (支持千分位与小数控制，如 "¥ 123,456.78")
 */
export function formatCurrency(
 amount: number | string | { toString(): string } | null | undefined,
 options: FormatCurrencyOptions = {},
): string {
 if (amount === null || amount === undefined || amount === "") {
  return "¥ 0.00";
 }

 const num = typeof amount === "number" ? amount : Number(amount);
 if (!Number.isFinite(num)) {
  return "¥ 0.00";
 }

 const { symbol = "¥", decimals = 2, space = true } = options;
 const isNegative = num < 0;
 const absNum = Math.abs(num);

 const fixed = absNum.toFixed(decimals);
 const [intPart, decPart] = fixed.split(".");
 const formattedInt = (intPart || "0").replace(/\B(?=(\d{3})+(?!\d))/g, ",");

 const formattedNum =
  decPart === undefined ? formattedInt : `${formattedInt}.${decPart}`;
 const prefix = isNegative ? `-${symbol}` : symbol;
 const separator = space ? " " : "";

 return `${prefix}${separator}${formattedNum}`;
}

/**
 * 格式化百分比 (如 0.125 -> "12.50%")
 */
export function formatPercent(
 value: number | string | null | undefined,
 decimals: number = 2,
): string {
 if (value === null || value === undefined || value === "") {
  return "0.00%";
 }

 const num = typeof value === "number" ? value : Number(value);
 if (!Number.isFinite(num)) {
  return "0.00%";
 }

 // 若数值在 0 到 1 之间，通常为比率，转为百分比；若已大于 1，则视为百分值
 const rate = Math.abs(num) <= 1 && num !== 0 ? num * 100 : num;
 return `${rate.toFixed(decimals)}%`;
}

/**
 * 格式化通用数值千分位
 */
export function formatNumber(
 value: number | string | null | undefined,
 decimals?: number,
): string {
 if (value === null || value === undefined || value === "") {
  return "0";
 }

 const num = typeof value === "number" ? value : Number(value);
 if (!Number.isFinite(num)) {
  return "0";
 }

 if (decimals !== undefined) {
  const fixed = num.toFixed(decimals);
  const [intPart, decPart] = fixed.split(".");
  const formattedInt = (intPart || "0").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decPart === undefined ? formattedInt : `${formattedInt}.${decPart}`;
 }

 const [intPart, decPart] = String(num).split(".");
 const formattedInt = (intPart || "0").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
 return decPart === undefined ? formattedInt : `${formattedInt}.${decPart}`;
}

/**
 * 格式化标准日期 (默认 YYYY-MM-DD)
 */
export function formatDate(
 date: Date | string | number | null | undefined,
): string {
 if (!date) return "";
 const d = date instanceof Date ? date : new Date(date);
 if (Number.isNaN(d.getTime())) return "";

 const y = d.getFullYear();
 const m = String(d.getMonth() + 1).padStart(2, "0");
 const day = String(d.getDate()).padStart(2, "0");
 return `${y}-${m}-${day}`;
}

/**
 * 格式化日期与时间 (默认 YYYY-MM-DD HH:mm:ss)
 */
export function formatDateTime(
 date: Date | string | number | null | undefined,
): string {
 if (!date) return "";
 const d = date instanceof Date ? date : new Date(date);
 if (Number.isNaN(d.getTime())) return "";

 const y = d.getFullYear();
 const m = String(d.getMonth() + 1).padStart(2, "0");
 const day = String(d.getDate()).padStart(2, "0");
 const h = String(d.getHours()).padStart(2, "0");
 const min = String(d.getMinutes()).padStart(2, "0");
 const s = String(d.getSeconds()).padStart(2, "0");
 return `${y}-${m}-${day} ${h}:${min}:${s}`;
}

/**
 * 格式化数据存储与传输容量大小 (如 1.50 MB)
 */
export function formatByteSize(bytes: number): string {
 if (!Number.isFinite(bytes) || bytes <= 0) {
  return "0 B";
 }

 const units = ["B", "KB", "MB", "GB", "TB", "PB"];
 const i = Math.floor(Math.log(bytes) / Math.log(1024));
 const clampedIndex = Math.min(i, units.length - 1);
 const size = bytes / 1024 ** clampedIndex;

 return `${size.toFixed(clampedIndex === 0 ? 0 : 2)} ${units[clampedIndex]}`;
}
