/** 员工档案信息模型 */
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
  readonly avatarUrl?: string | null;
  readonly roles: readonly string[];
  readonly status: string;
  readonly joinedAt: Date | null;
  readonly createdAt: Date;
}

/** 员工列表过滤查询参数 */
export interface ListEmployeesFilter {
  readonly page?: number;
  readonly pageSize?: number;
  readonly search?: string;
  readonly departmentId?: string;
  readonly includeChildren?: boolean;
  readonly positionId?: string;
  readonly role?: string;
  readonly status?: string;
}

/** 员工列表查询结果模型 */
export interface ListEmployeesResult {
  readonly items: readonly EmployeeItem[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
}

/** 直接录入建号创建员工输入模型 */
export interface DirectCreateEmployeeInput {
  readonly name: string;
  readonly email: string;
  readonly password?: string;
  readonly employeeNo?: string | null;
  readonly departmentId?: string | null;
  readonly positionId?: string | null;
  readonly managerEmployeeId?: string | null;
  readonly jobTitle?: string | null;
  readonly avatarUrl?: string | null;
  readonly initialRoleCodes?: readonly string[];
}

/** 调整部门输入模型 */
export interface TransferDepartmentInput {
  readonly employeeId: string;
  readonly targetDepartmentId: string | null;
  readonly reason?: string;
}

/** 调整岗位输入模型 */
export interface TransferPositionInput {
  readonly employeeId: string;
  readonly targetPositionId: string | null;
  readonly reason?: string;
}

/** 调整角色输入模型 */
export interface TransferRolesInput {
  readonly memberId: string;
  readonly newRoleCodes: readonly string[];
  readonly reason?: string;
}

/** 兼容旧列表过滤参数 */
export interface EmployeeListFilter {
  readonly departmentId?: string;
  readonly includeChildren?: boolean;
  readonly positionId?: string;
  readonly role?: string;
  readonly status?: string;
  readonly search?: string;
}
