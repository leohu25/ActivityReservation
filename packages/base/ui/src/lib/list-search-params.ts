import {
  createParser,
  createSearchParamsCache,
  parseAsBoolean,
  parseAsString,
} from "nuqs/server";

/** 列表默认分页：非法/越界回落 10，上限 100 */
const parseAsListPage = createParser<number>({
  parse(value) {
    const n = Number.parseInt(value, 10);
    if (!Number.isFinite(n) || n < 1) return null;
    return n;
  },
  serialize(value) {
    return String(value);
  },
}).withDefault(1);

const parseAsListPageSize = createParser<number>({
  parse(value) {
    const n = Number.parseInt(value, 10);
    if (!Number.isFinite(n) || n < 1 || n > 100) return null;
    return n;
  },
  serialize(value) {
    return String(value);
  },
}).withDefault(10);

/**
 * 列表默认 URL 契约（约定大于配置）。
 * 每个列表自动拥有 page / pageSize / keyword；业务只扩展字段。
 * 本模块为 **同构/server-safe**，RSC contract 可直接 import。
 */
export const listSearchParamsDefaults = {
  page: parseAsListPage,
  pageSize: parseAsListPageSize,
  keyword: parseAsString.withDefault(""),
};

export type ListSearchParamsValues = {
  page: number;
  pageSize: number;
  keyword: string;
  [key: string]: unknown;
};

export type ListSearchParamsExtensionInput = Record<string, unknown>;
export type ListSearchParamsParsers = Record<string, unknown>;

export interface DefinedListSearchParams {
  /** 归一化后的扩展 parser */
  readonly extensions: ListSearchParamsParsers;
  /** 完整 parsers = 默认 + 扩展 */
  readonly parsers: ListSearchParamsParsers;
  /** RSC：解析 searchParams */
  readonly parse: (
    searchParams:
      | Promise<Record<string, string | string[] | undefined>>
      | Record<string, string | string[] | undefined>,
  ) => Promise<ListSearchParamsValues>;
}

/** 业务扩展字段：传默认值即可（string/number/boolean），或直接传 nuqs parser */
function toParser(value: unknown) {
  if (typeof value === "string") {
    return parseAsString.withDefault(value);
  }
  if (typeof value === "number") {
    return createParser<number>({
      parse(raw) {
        const n = Number(raw);
        return Number.isFinite(n) ? n : null;
      },
      serialize(v) {
        return String(v);
      },
    }).withDefault(value);
  }
  if (typeof value === "boolean") {
    return parseAsBoolean.withDefault(value);
  }
  return value;
}

/**
 * 定义列表 URL 契约（唯一推荐入口，约定大于配置）。
 *
 * @example
 * // contract.ts（RSC 可安全引用，无需再 import parseAsString）
 * export const customerSearchParams = defineListSearchParams({
 *   category: "",
 *   status: "",
 * });
 * // RSC: const parsed = await customerSearchParams.parse(searchParams)
 * // Client: const list = useListSearch(customerSearchParams)
 */
export function defineListSearchParams(
  extensions: ListSearchParamsExtensionInput = {},
): DefinedListSearchParams {
  const normalizedExt: ListSearchParamsParsers = {};
  for (const [key, value] of Object.entries(extensions)) {
    normalizedExt[key] = toParser(value);
  }

  const parsers = {
    ...listSearchParamsDefaults,
    ...normalizedExt,
  };

  const cache = createSearchParamsCache(parsers as never);

  return {
    extensions: normalizedExt,
    parsers,
    parse: async (searchParams) => {
      const resolved = await Promise.resolve(searchParams);
      return (await cache.parse(resolved as never)) as ListSearchParamsValues;
    },
  };
}
