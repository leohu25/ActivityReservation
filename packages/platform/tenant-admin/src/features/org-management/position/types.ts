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

/** 岗位分页过滤条件 */
export interface ListPositionsFilter {
  readonly page?: number;
  readonly pageSize?: number;
  readonly keyword?: string;
  readonly status?: string;
}

/** 岗位分页响应模型 */
export interface ListPositionsResult {
  readonly items: readonly PositionItem[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
}
