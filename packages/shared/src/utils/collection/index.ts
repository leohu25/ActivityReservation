/**
 * @chenrun/shared - 常用集合与对象操作纯函数工具
 * 基于现代成熟的 radash 工业级套件深度优化
 */

import {
 group,
 cluster,
 unique,
 pick as radashPick,
 omit as radashOmit,
 clone,
 shake,
} from "radash";

/**
 * 按照指定键提取器对数组进行分组
 * 基于 radash.group 实现
 */
export function groupBy<T, K extends string | number | symbol>(
 array: readonly T[],
 keyFn: (item: T) => K,
): Record<K, T[]> {
 return group(array, keyFn) as Record<K, T[]>;
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
 * 基于 radash.cluster 实现
 */
export function chunk<T>(array: readonly T[], size: number): T[][] {
 if (size <= 0 || !Number.isFinite(size)) {
  return [array.slice()];
 }
 return cluster(array, size);
}

/**
 * 根据指定键提取器对数组去重 (保留首次出现的元素)
 * 基于 radash.unique 实现
 */
export function uniqBy<T, K extends string | number | symbol>(
 array: readonly T[],
 keyFn: (item: T) => K,
): T[] {
 return unique(array, keyFn);
}

/**
 * 从对象中选取指定的属性子集 (白名单挑选)
 * 基于 radash.pick 实现
 */
export function pick<T extends object, K extends keyof T>(
 obj: T,
 keys: readonly K[],
): Pick<T, K> {
 return radashPick(obj, keys as K[]);
}

/**
 * 从对象中剔除指定的属性 (黑名单剥离)
 * 基于 radash.omit 实现
 */
export function omit<T extends object, K extends keyof T>(
 obj: T,
 keys: readonly K[],
): Omit<T, K> {
 return radashOmit(obj, keys as K[]);
}

/**
 * 深度克隆与空值清洗等增强工具直通导出
 */
export { clone as deepClone, shake as cleanObject };
