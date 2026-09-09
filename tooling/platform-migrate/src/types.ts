export interface PlatformMigrationDefinition {
  readonly version: string;
  readonly name: string;
  readonly description?: string;
  readonly checksum?: string;
  readonly upSql: string;
  readonly downSql?: string;
}

export interface PlatformMigrationRecord {
  readonly version: string;
  readonly migrationName: string;
  readonly checksum?: string;
  readonly appliedAt: Date;
}

export interface PlatformMigrationStatusReport {
  readonly currentVersion?: string;
  readonly appliedMigrations: readonly PlatformMigrationRecord[];
  readonly pendingMigrations: readonly PlatformMigrationDefinition[];
}
