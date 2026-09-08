/**
 * 租户组织架构与员工部门拓扑自驱解析引擎
 * 遵循《SaaS Foundation 权限系统完整设计方案》第 8、9、20 节规范，
 * 将租户物理数据库中的 EmployeeProfile 员工档案与 Department 部门树自驱装配为 CASL 数据范围拓扑。
 */

export interface EmployeeTopologyContext {
  /** 平台全局用户 ID */
  readonly userId: string;
  /** 租户组织成员 Member ID (对应 Control DB member.id) */
  readonly memberId: string;
}

export interface ResolvedDepartmentTopology {
  /** 平台全局用户 ID */
  readonly userId: string;
  /** 当前所属部门 ID，未分配部门时为 null */
  readonly departmentId: string | null;
  /** 当前部门及其所有下级子部门 ID 集合 (含自身) */
  readonly departmentTreeIds: readonly string[];
  /** 员工档案编号/工号 */
  readonly employeeNo?: string | null;
  /** 职务/岗位头衔 */
  readonly jobTitle?: string | null;
}

export interface DepartmentNode {
  readonly id: string;
  readonly parentId?: string | null;
}

export interface DepartmentTopologyReader {
  findEmployeeProfile(memberId: string): Promise<{
    id: string;
    memberId: string;
    departmentId: string | null;
    employeeNo: string | null;
    jobTitle: string | null;
    status: string;
  } | null>;
  findAllDepartments(): Promise<readonly DepartmentNode[]>;
}

/**
 * 根据部门列表与根节点 ID，递归展开该部门及其所有下级子部门的全部 ID。
 * 包含防环保护，避免层级数据异常产生死循环。
 */
export function collectDepartmentTreeIds(
  departments: readonly DepartmentNode[],
  rootDepartmentId: string,
): string[] {
  const childrenMap = new Map<string, string[]>();
  const allIds = new Set<string>();

  for (const dept of departments) {
    allIds.add(dept.id);
    if (dept.parentId) {
      const list = childrenMap.get(dept.parentId) ?? [];
      list.push(dept.id);
      childrenMap.set(dept.parentId, list);
    }
  }

  // 根部门不存在于列表时，退化为仅包含根部门自身
  if (!allIds.has(rootDepartmentId)) {
    return [rootDepartmentId];
  }

  const result: string[] = [];
  const visited = new Set<string>();
  const queue: string[] = [rootDepartmentId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) {
      continue;
    }
    visited.add(current);
    result.push(current);

    const children = childrenMap.get(current);
    if (children) {
      for (const childId of children) {
        if (!visited.has(childId)) {
          queue.push(childId);
        }
      }
    }
  }

  return result;
}

/**
 * 自驱解析当前登录成员的组织与数据范围拓扑。
 * 当用户未建立员工档案或未分配部门时，返回 Fail-Closed 安全上下文。
 */
export async function resolveEmployeeTopology(
  reader: DepartmentTopologyReader,
  context: EmployeeTopologyContext,
): Promise<ResolvedDepartmentTopology> {
  const profile = await reader.findEmployeeProfile(context.memberId);

  // 员工档案不存在或状态为非激活态，严格执行 Fail-Closed
  if (!profile || profile.status !== "ACTIVE" || !profile.departmentId) {
    return {
      userId: context.userId,
      departmentId: null,
      departmentTreeIds: [],
      employeeNo: profile?.employeeNo,
      jobTitle: profile?.jobTitle,
    };
  }

  const allDepartments = await reader.findAllDepartments();
  const treeIds = collectDepartmentTreeIds(
    allDepartments,
    profile.departmentId,
  );

  return {
    userId: context.userId,
    departmentId: profile.departmentId,
    departmentTreeIds: treeIds,
    employeeNo: profile.employeeNo,
    jobTitle: profile.jobTitle,
  };
}
