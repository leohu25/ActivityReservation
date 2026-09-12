export interface TenantFleetItem {
  readonly organizationId: string;
  readonly organizationName: string;
  readonly slug: string;
  readonly databaseName: string;
  readonly currentVersion: string;
  readonly isUpToDate: boolean;
  readonly status: string;
  readonly pendingVersionCount: number;
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
    readonly pendingCount: number;
    readonly items: readonly TenantFleetItem[];
  };
}
