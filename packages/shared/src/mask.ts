/**
 * @chenrun/shared - 敏感数据安全脱敏工具 (配合 ERP 字段权限与防泄漏保护)
 */

/**
 * 手机号脱敏 (保留前3后4，中间4位星号，如 138****5678)
 */
export function maskPhone(phone: string | null | undefined): string {
 if (!phone) return "";
 const trimmed = phone.trim();
 if (trimmed.length !== 11) {
  return trimmed.replace(/^(.{2})(.*)(.{2})$/, "$1****$3");
 }
 return trimmed.replace(/^(\d{3})\d{4}(\d{4})$/, "$1****$2");
}

/**
 * 电子邮箱脱敏 (保留首字母和域名，如 z***@chenrun.com)
 */
export function maskEmail(email: string | null | undefined): string {
 if (!email) return "";
 const trimmed = email.trim();
 const atIndex = trimmed.indexOf("@");
 if (atIndex <= 1) {
  return trimmed;
 }
 const prefix = trimmed.slice(0, 1);
 const domain = trimmed.slice(atIndex);
 return `${prefix}***${domain}`;
}

/**
 * 身份证件号脱敏 (保留前6后4，中间8位星号，如 330102********1234)
 */
export function maskIdCard(idCard: string | null | undefined): string {
 if (!idCard) return "";
 const trimmed = idCard.trim();
 if (trimmed.length < 8) return "******";
 return trimmed.replace(/^(.{6})(.*)(.{4})$/, "$1********$3");
}

/**
 * 银行账号脱敏 (保留前4后4，中间用4位星号间隔，如 6222 **** **** 1234)
 */
export function maskBankCard(cardNo: string | null | undefined): string {
 if (!cardNo) return "";
 const clean = cardNo.replace(/\s+/g, "");
 if (clean.length < 8) return "************";
 const start = clean.slice(0, 4);
 const end = clean.slice(-4);
 return `${start} **** **** ${end}`;
}

/**
 * 真实姓名脱敏 (如 "李四" -> "李*"，"张大强" -> "张*强"，"欧阳六六" -> "欧**六")
 */
export function maskName(name: string | null | undefined): string {
 if (!name) return "";
 const trimmed = name.trim();
 if (trimmed.length <= 1) return trimmed;
 if (trimmed.length === 2) return `${trimmed[0]}*`;
 const first = trimmed[0];
 const last = trimmed.slice(-1);
 const stars = "*".repeat(trimmed.length - 2);
 return `${first}${stars}${last}`;
}
