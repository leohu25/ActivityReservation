/**
 * @chenrun/shared - 常用集合与对象操作纯函数工具
 */

/**
 * 按照指定键提取器对数组进行分组
 */
export function groupBy<T, K extends string | number | symbol>(
  array: readonly T[],
  keyFn: (item: T) => K,
): Record<K, T[]> {
  const result = {} as Record<K, T[]>;
  for (const item of array) {
    const key = keyFn(item);
    if (!result[key]) {
      result[key] = [];
    }
    result[key].push(item);
  }
  return result;
}

/**
 * 按照指定键提取器将数组索引为对象字典 (后续元素覆盖前面元素)
 */
export function keyBy<T, K extends string | number | symbol>(
  array: readonly T[],
  keyFn: (item: T) => K,
): Record<K, T> {
  const result = {} as Record<K, T>;
  for (const item of array) {
    result[keyFn(item)] = item;
  }
  return result;
}

/**
 * 将数组按指定大小分块拆分
 */
export function chunk<T>(array: readonly T[], size: number): T[][] {
  if (size <= 0 || !Number.isFinite(size)) {
    return [array.slice()];
  }
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

/**
 * 根据指定键提取器对数组去重 (保留首次出现的元素)
 */
export function uniqBy<T, K>(array: readonly T[], keyFn: (item: T) => K): T[] {
  const seen = new Set<K>();
  const result: T[] = [];
  for (const item of array) {
    const key = keyFn(item);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }
  return result;
}

/**
 * 从对象中选取指定的属性子集 (白名单挑选)
 */
export function pick<T extends object, K extends keyof T>(
  obj: T,
  keys: readonly K[],
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result;
}

/**
 * 从对象中剔除指定的属性 (黑名单剥离)
 */
export function omit<T extends object, K extends keyof T>(
  obj: T,
  keys: readonly K[],
): Omit<T, K> {
  const omitSet = new Set<keyof T>(keys);
  const result: Partial<T> = {};
  for (const key of Object.keys(obj) as Array<keyof T>) {
    if (!omitSet.has(key)) {
      result[key] = obj[key];
    }
  }
  return result as Omit<T, K>;
}
