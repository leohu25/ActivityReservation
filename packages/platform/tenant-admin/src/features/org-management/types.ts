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

/** 岗位展示信息模型 */
export interface PositionItem {
  readonly id: string;
  readonly name: string;
  readonly code: string;
  readonly description: string | null;
  readonly sort: number;
  readonly status: string;
  readonly employeeCount: number;
  readonly createdAt: Date;
}

/** 创建岗位输入模型 */
export interface CreatePositionInput {
  readonly name: string;
  readonly code: string;
  readonly description?: string | null;
  readonly sort?: number;
}

/** 更新岗位输入模型 */
export interface UpdatePositionInput {
  readonly name?: string;
  readonly code?: string;
  readonly description?: string | null;
  readonly sort?: number;
  readonly status?: string;
}

/** 员工管理列表单项模型 */
export interface EmployeeItem {
  readonly id: string;
  readonly memberId: string | null;
  readonly userId: string | null;
  readonly employeeNo: string | null;
  readonly name: string;
  readonly email: string;
  readonly departmentId: string | null;
  readonly departmentName: string | null;
  readonly positionId: string | null;
  readonly positionName: string | null;
  readonly managerEmployeeId: string | null;
  readonly managerName: string | null;
  readonly jobTitle: string | null;
  readonly roles: readonly string[];
  readonly status: string;
  readonly joinedAt: Date | null;
  readonly createdAt: Date;
}

/** 员工列表查询过滤条件 */
export interface EmployeeListFilter {
  readonly departmentId?: string;
  readonly includeChildren?: boolean;
  readonly positionId?: string;
  readonly role?: string;
  readonly status?: string;
  readonly search?: string;
}

/** 直接录入建号创建员工输入 */
export interface DirectCreateEmployeeInput {
  readonly name: string;
  readonly email: string;
  readonly employeeNo?: string;
  readonly departmentId?: string | null;
  readonly positionId?: string | null;
  readonly managerEmployeeId?: string | null;
  readonly jobTitle?: string;
  readonly initialRoleCodes: readonly string[];
  readonly password?: string;
}

/** 调换部门输入 */
export interface TransferDepartmentInput {
  readonly employeeId: string;
  readonly targetDepartmentId: string | null;
}

/** 调换岗位输入 */
export interface TransferPositionInput {
  readonly employeeId: string;
  readonly targetPositionId: string | null;
}

/** 调换角色输入 */
export interface TransferRolesInput {
  readonly memberId: string;
  readonly newRoleCodes: readonly string[];
}
