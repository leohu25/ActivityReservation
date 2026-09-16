/**
 * @base/shared/src/utils/query/keyword-search-engine.ts
 *
 * 搜索契约服务端安全执行引擎
 * 自动完成：
 * 1. 关键字安全清洗 (防止 SQL 注入与控制字符污染)
 * 2. 关系穿透自动反查 (并发执行、带熔断与去重)
 * 3. 构造 Prisma 参数化 OR 条件
 */

import { type SearchContract, sanitizeSearchKeyword } from "./keyword-search";

export interface ExecuteSearchContractOptions {
  /** 关联反查单次最大返回数量（防止海量同名数据爆内存，默认 100） */
  maxRelationResults?: number;
}

/**
 * 安全执行搜索契约，返回标准的 Prisma OR 条件数组
 *
 * @param client 数据库客户端
 * @param contract 搜索契约定义
 * @param rawKeyword 用户输入的原始关键字
 * @param options 执行配置选项
 */
export async function executeSearchContract<
  TClient extends Record<string, unknown>,
>(
  client: TClient,
  contract: SearchContract<TClient>,
  rawKeyword?: unknown,
  options: ExecuteSearchContractOptions = {},
): Promise<Record<string, unknown>[]> {
  const cleanKeyword = sanitizeSearchKeyword(rawKeyword);
  if (!cleanKeyword) return [];

  const maxLimit = options.maxRelationResults ?? 100;
  const orConditions: Record<string, unknown>[] = [];

  // 1. 主表直接字段的包含查询 (insensitive)
  if (contract.direct && contract.direct.length > 0) {
    for (const d of contract.direct) {
      if (d.field) {
        orConditions.push({
          [d.field]: { contains: cleanKeyword, mode: "insensitive" },
        });
      }
    }
  }

  // 2. 跨表穿透关联反查
  if (contract.relations && contract.relations.length > 0) {
    const relationPromises = contract.relations.map(async (rel) => {
      try {
        // 优先使用自定义 query
        if (rel.query) {
          const codes = await rel.query(client, cleanKeyword);
          return { targetField: rel.targetField, codes: codes || [] };
        }

        // 其次使用声明式 relationModel + searchField 反查
        if (rel.relationModel && rel.searchField) {
          const delegate = client[rel.relationModel] as
            | {
                findMany?: (
                  args: Record<string, unknown>,
                ) => Promise<Record<string, unknown>[]>;
              }
            | undefined;
          if (delegate && typeof delegate.findMany === "function") {
            const results = await delegate.findMany({
              where: {
                [rel.searchField]: {
                  contains: cleanKeyword,
                  mode: "insensitive",
                },
                isDeleted: false,
              },
              select: {
                [rel.targetField]: true,
              },
              take: maxLimit,
            });
            const codes = results
              .map((item: Record<string, unknown>) =>
                String(item[rel.targetField] ?? ""),
              )
              .filter(Boolean);
            return { targetField: rel.targetField, codes };
          }
        }
      } catch (err) {
        // 容错降级：单个关联查询失败不击垮全流程
        console.error(
          `[executeSearchContract] Error querying relation for ${rel.targetField}:`,
          err,
        );
      }
      return { targetField: rel.targetField, codes: [] };
    });

    const relationResults = await Promise.all(relationPromises);

    for (const res of relationResults) {
      if (res.codes.length > 0) {
        const uniqueCodes = Array.from(new Set(res.codes));
        orConditions.push({
          [res.targetField]: { in: uniqueCodes },
        });
      }
    }
  }

  return orConditions;
}
