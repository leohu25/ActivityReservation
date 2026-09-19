/** 部门树节点视图模型 */
export interface DepartmentTreeNode {
  readonly id: string;
  readonly name: string;
  readonly code: string;
  readonly parentId: string | null;
  readonly leaderMemberId: string | null;
  readonly leaderName: string | null;
  readonly sort: number;
  readonly status: string;
  readonly employeeCount: number;
  readonly children: readonly DepartmentTreeNode[];
  readonly createdAt: Date;
}

/** 创建部门输入模型 */
export interface CreateDepartmentInput {
  readonly name: string;
  readonly code: string;
  readonly parentId?: string | null;
  readonly leaderMemberId?: string | null;
  readonly sort?: number;
}

/** 更新部门输入模型 */
export interface UpdateDepartmentInput {
  readonly name?: string;
  readonly code?: string;
  readonly parentId?: string | null;
  readonly leaderMemberId?: string | null;
  readonly sort?: number;
  readonly status?: string;
}
