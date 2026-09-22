export interface TenantFleetItem {
  readonly organizationId: string;
  readonly organizationName: string;
  readonly slug: string;
  readonly databaseName: string;
  readonly currentVersion: string;
  readonly isUpToDate: boolean;
  readonly status: string;
  readonly pendingVersionCount: number;
  /** 该库待补执行的迁移版本号列表 */
  readonly pendingVersions?: readonly string[];
}

export interface MigrationDashboardData {
  readonly platform: {
    readonly currentVersion?: string;
    readonly latestAvailableVersion?: string;
    readonly isUpToDate: boolean;
    readonly pendingCount: number;
  };
  readonly fleet: {
    readonly latestAvailableVersion: string;
    readonly totalCount: number;
    readonly upToDateCount: number;
    /** 待升级租户库数量 */
    readonly pendingCount: number;
    /** 全舰队待补执行的迁移版本总数 */
    readonly pendingVersionTotal: number;
    readonly items: readonly TenantFleetItem[];
  };
}
