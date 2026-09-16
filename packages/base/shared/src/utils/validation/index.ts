/**
 * @base/shared - 企业业务与合规字段校验工具
 */

/** 统一社会信用代码字符基数与权重代码表 (GB 32100-2015) */
const CREDIT_CODE_CHARS = "0123456789ABCDEFGHJKLMNPQRTUWXY";
const CREDIT_CODE_WEIGHTS = [
 1, 3, 9, 27, 19, 26, 16, 17, 20, 29, 25, 13, 8, 24, 10, 30, 28,
];

/**
 * 校验中国大陆 18 位统一社会信用代码合规性 (GB 32100-2015 算法)
 */
export function isValidUnifiedSocialCreditCode(
 code: string | null | undefined,
): boolean {
 if (!code) return false;
 const cleanCode = code.trim().toUpperCase();
 if (cleanCode.length !== 18) return false;

 // 正则基础格式检查
 const regex = /^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/;
 if (!regex.test(cleanCode)) {
  return false;
 }

 // 校验位计算
 let sum = 0;
 for (let i = 0; i < 17; i++) {
  const char = cleanCode[i];
  if (!char) return false;
  const index = CREDIT_CODE_CHARS.indexOf(char);
  const weight = CREDIT_CODE_WEIGHTS[i];
  if (index === -1 || weight === undefined) return false;
  sum += index * weight;
 }

 const remainder = sum % 31;
 const checkCodeIndex = remainder === 0 ? 0 : 31 - remainder;
 const expectedCheckChar = CREDIT_CODE_CHARS[checkCodeIndex];

 return cleanCode[17] === expectedCheckChar;
}

/**
 * 校验中国大陆 11 位手机号码格式
 */
export function isValidMobilePhone(phone: string | null | undefined): boolean {
 if (!phone) return false;
 const cleanPhone = phone.trim();
 return /^1[3-9]\d{9}$/.test(cleanPhone);
}

/**
 * 校验电子邮件格式
 */
export function isValidEmail(email: string | null | undefined): boolean {
 if (!email) return false;
 const cleanEmail = email.trim();
 // 标准 RFC 5322 兼容常用邮箱正则
 const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
 return emailRegex.test(cleanEmail);
}
