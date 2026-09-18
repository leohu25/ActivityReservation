export interface SerialCodeOptions {
	/** 业务前缀，如 'CUST'、'CAT'、'TAG' */
	prefix: string;
	/** 日期格式，默认 'YYYYMMDD' */
	datePattern?: "YYYYMMDD" | "NONE";
	/** 分隔符，默认 '-' */
	separator?: string;
	/** 序列号位数（补零），默认 4 位 */
	digits?: number;
	/** 当前最新一条记录的编码（可为 undefined / null） */
	latestCode?: string | null;
	/** 指定基准日期，默认当前时间 */
	now?: Date;
}

/**
 * 通用业务连续流水号生成器。
 * 格式示例：
 * - 默认: `CUST-20260408-0001`
 * - 下划线分隔: `TAG_20260408_0001`
 * - 无日期: `CAT-0001`
 */
export function generateDateSerialCode(options: SerialCodeOptions): string {
	const {
		prefix,
		datePattern = "YYYYMMDD",
		separator = "-",
		digits = 4,
		latestCode,
		now = new Date(),
	} = options;

	let prefixWithDate = prefix;
	if (datePattern === "YYYYMMDD") {
		const yyyy = now.getFullYear();
		const mm = String(now.getMonth() + 1).padStart(2, "0");
		const dd = String(now.getDate()).padStart(2, "0");
		prefixWithDate = `${prefix}${separator}${yyyy}${mm}${dd}`;
	}

	const basePrefix = `${prefixWithDate}${separator}`;

	let nextSeq = 1;
	if (latestCode && latestCode.startsWith(basePrefix)) {
		const rawSeq = latestCode.slice(basePrefix.length);
		const parsed = parseInt(rawSeq, 10);
		if (!Number.isNaN(parsed) && parsed > 0) {
			nextSeq = parsed + 1;
		}
	}

	return `${basePrefix}${String(nextSeq).padStart(digits, "0")}`;
}
