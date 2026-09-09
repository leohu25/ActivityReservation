/**
 * ERP 四层权限架构中支持的数据权限范围类型：
 * - SELF: 仅本人创建或归属于本人的业务数据。
 * - DEPT: 仅归属于当前用户所属部门的业务数据。
 * - DEPT_TREE: 归属于当前用户所属部门及其所有下级子部门的数据。
 * - CUSTOM: 显式枚举指定的自定义部门数据。
 * - ALL: 整个租户组织范围内的全量数据，无范围限制。
 */
export const DataScope = {
  SELF: "SELF",
  DEPT: "DEPT",
  DEPT_TREE: "DEPT_TREE",
  CUSTOM: "CUSTOM",
  ALL: "ALL",
} as const;

export type DataScopeType = (typeof DataScope)[keyof typeof DataScope];

/**
 * 角色数据范围配置契约
 */
export interface RoleDataScopeConfig {
  readonly role: string;
  readonly resource: string;
  readonly action?: string;
  readonly scopeType: DataScopeType;
  readonly customDepartmentIds?: readonly string[];
}

/**
 * 用户部门拓扑上下文信息
 */
export interface UserDepartmentTopology {
  readonly userId: string;
  readonly departmentId?: string | null;
  readonly departmentTreeIds?: readonly string[];
}

/**
 * 实体字段映射配置，用于生成 Prisma 条件过滤器
 */
export interface DataScopeFieldMapping {
  /** 实体中存储创建人/所属人用户 ID 的字段名，默认为 "createdById" */
  readonly userIdField?: string;
  /** 实体中存储所属部门 ID 的字段名，默认为 "deptId" */
  readonly departmentIdField?: string;
}

/**
 * CASL 规则所使用的 Prisma 查询条件表达式对象
 */
export type PrismaQueryCondition = Record<string, unknown>;

/**
 * 数据范围处理异常
 */
export class DataScopeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DataScopeError";
  }
}

/**
 * 解析单个角色数据范围配置为对应的 Prisma 查询条件片段。
 * 当上下文数据缺失时，强制执行 Fail-Closed 安全关闭策略。
 */
function resolveScopeCondition(
  scope: RoleDataScopeConfig,
  topology: UserDepartmentTopology,
  userIdField: string,
  departmentIdField: string,
): PrismaQueryCondition | undefined {
  switch (scope.scopeType) {
    case DataScope.SELF:
      // 当 userId 为空时严格执行 Fail-Closed，防止 undefined 导致 Prisma where 忽略过滤条件造成全表泄露
      return topology.userId
        ? { [userIdField]: topology.userId }
        : { [userIdField]: "__NO_USER_FAIL_CLOSED__" };

    case DataScope.DEPT:
      // 当用户未归属于任何部门时严格执行 Fail-Closed
      return topology.departmentId
        ? { [departmentIdField]: topology.departmentId }
        : { [departmentIdField]: "__NO_DEPARTMENT_FAIL_CLOSED__" };

    case DataScope.DEPT_TREE: {
      const treeIds =
        topology.departmentTreeIds ??
        (topology.departmentId ? [topology.departmentId] : []);
      // 部门树为空时严格执行 Fail-Closed
      if (treeIds.length === 0) {
        return {
          [departmentIdField]: { in: ["__NO_DEPARTMENT_FAIL_CLOSED__"] },
        };
      }
      return treeIds.length === 1
        ? { [departmentIdField]: treeIds[0] }
        : { [departmentIdField]: { in: [...treeIds] } };
    }

    case DataScope.CUSTOM: {
      const customIds = scope.customDepartmentIds ?? [];
      // 自定义部门列表为空时严格执行 Fail-Closed
      if (customIds.length === 0) {
        return {
          [departmentIdField]: { in: ["__NO_CUSTOM_DEPARTMENT_FAIL_CLOSED__"] },
        };
      }
      return customIds.length === 1
        ? { [departmentIdField]: customIds[0] }
        : { [departmentIdField]: { in: [...customIds] } };
    }

    case DataScope.ALL:
      // 全量组织范围无约束
      return undefined;

    default: {
      const invalid: never = scope.scopeType;
      throw new DataScopeError(`不支持的数据范围类型: ${invalid}`);
    }
  }
}

/**
 * 将一组角色数据范围配置与用户部门拓扑解析为最终的 Prisma 查询条件。
 * 多个范围配置采用并集 (OR) 进行合并；若包含 ALL 范围，则直接返回 undefined（无条件约束）。
 */
export function resolveDataScopeConditions(
  scopes: readonly RoleDataScopeConfig[],
  topology: UserDepartmentTopology,
  fieldMapping: DataScopeFieldMapping = {},
): PrismaQueryCondition | undefined {
  if (scopes.length === 0) {
    return undefined;
  }

  // 只要任意角色授予了 ALL 范围，即全量放开数据约束
  if (scopes.some((s) => s.scopeType === "ALL")) {
    return undefined;
  }

  const userIdField = fieldMapping.userIdField ?? "createdById";
  const departmentIdField = fieldMapping.departmentIdField ?? "deptId";
  const conditions: PrismaQueryCondition[] = [];

  for (const scope of scopes) {
    const cond = resolveScopeCondition(
      scope,
      topology,
      userIdField,
      departmentIdField,
    );
    if (cond) {
      conditions.push(cond);
    }
  }

  if (conditions.length === 0) {
    return undefined;
  }
  if (conditions.length === 1) {
    return conditions[0];
  }

  // 多个范围条件取并集 (OR)
  return {
    OR: conditions,
  };
}
