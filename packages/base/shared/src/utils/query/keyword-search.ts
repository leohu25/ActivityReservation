/**
 * @base/shared/src/utils/query/keyword-search.ts
 *
 * 企业级搜索契约（SearchContract）核心定义与安全防护工具
 * 遵循 Prisma 强类型参数化安全标准，从源头杜绝 SQL 注入与控制字符污染
 */

/**
 * 直接搜索字段定义（主表自身的字段）
 */
export interface DirectSearchField {
  /** 数据库/模型字段名，例如 orderId / salesPerson */
  field: string;
  /** 中文业务标签，例如 订单号 / 销售员 */
  label: string;
}

/**
 * 跨表穿透关联搜索字段定义（通过外键关联其他模型）
 */
export interface RelationSearchField<TClient = unknown> {
  /** 主表上的外键字段名，例如 customerCode / storeCode */
  targetField: string;
  /** 关联模型在客户端上的属性名，例如 customer / customerStore */
  relationModel?: string;
  /** 关联模型被搜索的字段名，例如 customerName / storeName */
  searchField?: string;
  /** 中文业务标签，例如 客户 / 门店 */
  label: string;
  /**
   * 自定义执行查询的回调（解耦 Prisma 模型类型依赖）
   * @param client 数据库客户端实例
   * @param cleanKeyword 已经过安全清洗的关键字
   * @returns 匹配到的主键/外键编码列表
   */
  query?: (client: TClient, cleanKeyword: string) => Promise<string[]>;
}

/**
 * 统一定义的搜索契约 (Single Source of Truth)
 */
export interface SearchContract<TClient = unknown> {
  /** 主表直接匹配的文本字段列表 */
  direct: readonly DirectSearchField[];
  /** 跨表穿透关联的字段列表 */
  relations?: readonly RelationSearchField<TClient>[];
}

/**
 * 清洗搜索关键字，防止 SQL 注入、特殊不可见控制字符污染与 ReDoS
 *
 * 1. 去除首尾空白；
 * 2. 剔除 ASCII 控制字符 (0x00-0x1F, 0x7F)；
 * 3. 截断最大 100 字符，杜绝超大 payload 内存攻击；
 * 4. 彻底免疫 SQL 注入（后续在 ORM 层面全量使用参数化 Prepared Statement）。
 */
export function sanitizeSearchKeyword(raw?: unknown): string {
  if (typeof raw !== "string") return "";
  const trimmed = raw.trim();
  if (!trimmed) return "";
  // 剔除不可见控制字符
  const cleaned = trimmed.replace(/[\x00-\x1f\x7f]/g, "");
  return cleaned.slice(0, 100);
}

/**
 * 根据搜索契约自动生成语义化、精准的前端输入框占位符
 * 格式：`输入订单号 / 销售员 / 客户 / 门店...`
 */
export function generateSearchPlaceholder(
  contract?: SearchContract<unknown> | null,
  fallback = "输入关键字搜索...",
): string {
  if (!contract) return fallback;

  const labels: string[] = [];
  if (contract.direct) {
    for (const d of contract.direct) {
      if (d.label && !labels.includes(d.label)) {
        labels.push(d.label);
      }
    }
  }
  if (contract.relations) {
    for (const r of contract.relations) {
      if (r.label && !labels.includes(r.label)) {
        labels.push(r.label);
      }
    }
  }

  if (labels.length === 0) return fallback;
  return `输入 ${labels.join(" / ")}...`;
}
