import pg from "pg";

/**
 * 租户物理数据库 SQL 执行器抽象接口
 */
export interface TenantSqlExecutor {
  /** 执行无返回结果的 DDL 或 DML 语句 */
  execute(sql: string, params?: readonly unknown[]): Promise<void>;

  /** 执行查询并返回强类型记录集合 */
  query<T = Record<string, unknown>>(
    sql: string,
    params?: readonly unknown[],
  ): Promise<T[]>;

  /** 在单个事务中执行一系列操作，异常时自动回滚 */
  transaction<T>(callback: (tx: TenantSqlExecutor) => Promise<T>): Promise<T>;

  /** 释放底层连接池或连接 */
  close(): Promise<void>;
}

/**
 * 创建租户 SQL 执行器的工厂函数契约
 */
export type TenantSqlExecutorFactory = (
  databaseUrl: string,
) => Promise<TenantSqlExecutor> | TenantSqlExecutor;

/**
 * 基于 pg.Pool 实现的 PostgreSQL 执行器
 */
export class PgSqlExecutor implements TenantSqlExecutor {
  private readonly pool: pg.Pool;

  constructor(
    connectionStringOrPool: string | pg.Pool,
    poolConfig?: pg.PoolConfig,
  ) {
    if (typeof connectionStringOrPool === "string") {
      this.pool = new pg.Pool({
        connectionString: connectionStringOrPool,
        max: poolConfig?.max ?? 5,
        idleTimeoutMillis: poolConfig?.idleTimeoutMillis ?? 10000,
        connectionTimeoutMillis: poolConfig?.connectionTimeoutMillis ?? 10000,
        ...poolConfig,
      });
    } else {
      this.pool = connectionStringOrPool;
    }
  }

  /** 执行单个 SQL 语句 */
  async execute(sql: string, params?: readonly unknown[]): Promise<void> {
    await this.pool.query(sql, params ? [...params] : undefined);
  }

  /** 查询多条记录 */
  async query<T = Record<string, unknown>>(
    sql: string,
    params?: readonly unknown[],
  ): Promise<T[]> {
    const result = await this.pool.query(sql, params ? [...params] : undefined);
    return result.rows as T[];
  }

  /** 在事务包装中执行 */
  async transaction<T>(
    callback: (tx: TenantSqlExecutor) => Promise<T>,
  ): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const clientExecutor: TenantSqlExecutor = {
        async execute(sql: string, params?: readonly unknown[]): Promise<void> {
          await client.query(sql, params ? [...params] : undefined);
        },
        async query<R = Record<string, unknown>>(
          sql: string,
          params?: readonly unknown[],
        ): Promise<R[]> {
          const res = await client.query(sql, params ? [...params] : undefined);
          return res.rows as R[];
        },
        async transaction(): Promise<never> {
          throw new Error("不支持在已有事务中嵌套开启新事务");
        },
        async close(): Promise<void> {
          // 事务内执行器无需单独关闭，由外层释放客户端
        },
      };

      const result = await callback(clientExecutor);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      try {
        await client.query("ROLLBACK");
      } catch {
        // 忽略回滚本身的次级异常
      }
      throw error;
    } finally {
      client.release();
    }
  }

  /** 关闭连接池 */
  async close(): Promise<void> {
    await this.pool.end();
  }
}

/**
 * 默认 pg 执行器工厂方法
 */
export function createDefaultPgSqlExecutorFactory(): TenantSqlExecutorFactory {
  return (databaseUrl: string) => new PgSqlExecutor(databaseUrl);
}
