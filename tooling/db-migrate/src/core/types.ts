export type MigrationScope = "platform" | "tenant";

export type MigrationRiskCode =
  | "DROP_TABLE"
  | "DROP_COLUMN"
  | "TRUNCATE"
  | "ALTER_COLUMN_TYPE"
  | "ADD_REQUIRED_COLUMN"
  | "ADD_UNIQUE_CONSTRAINT"
  | "DROP_ENUM_VALUE"
  | "OUT_OF_ORDER_MIGRATION";

export interface MigrationRisk {
  readonly code: MigrationRiskCode;
  readonly message: string;
  readonly statement: string;
}

export interface DestructiveApproval {
  readonly reason: string;
  readonly dataPlan: string;
  readonly rollbackPlan: string;
}

export interface MigrationManifest {
  readonly formatVersion: 1;
  readonly scope: MigrationScope;
  readonly version: string;
  readonly name: string;
  readonly previousVersion: string | null;
  readonly checksum: string;
  readonly schemaChecksum: string;
  readonly createdAt: string;
  readonly risks: readonly MigrationRisk[];
  readonly approval?: DestructiveApproval;
  readonly rollbackSupported: boolean;
}

export interface MigrationArtifact extends MigrationManifest {
  readonly upSql: string;
  readonly downSql?: string;
}

export interface BaselineManifest {
  readonly formatVersion: 1;
  readonly scope: MigrationScope;
  readonly version: string;
  readonly checksum: string;
  readonly schemaChecksum: string;
  readonly generatedAt: string;
}

export interface BaselineArtifact extends BaselineManifest {
  readonly sql: string;
}

export interface MigrationRuntimeCatalog {
  readonly scope: MigrationScope;
  readonly baseline: BaselineArtifact;
  readonly migrations: readonly MigrationArtifact[];
}

export interface MigrationPreflightResult {
  readonly currentVersion: string | null;
  readonly targetVersion: string;
  readonly pendingVersions: readonly string[];
  readonly risks: readonly MigrationRisk[];
  readonly checksumValid: boolean;
  readonly executable: boolean;
  readonly messages: readonly string[];
}

export interface MigrationExecutionResult {
  readonly appliedCount: number;
  readonly appliedVersions: readonly string[];
}

export interface TenantFleetResult {
  readonly upgradedCount: number;
  readonly failedCount: number;
}

export type DatabaseInitializationState =
  "EMPTY" | "READY" | "UPGRADE_REQUIRED" | "PARTIAL" | "CHECKSUM_MISMATCH";

export interface DatabaseInitializationInspection {
  readonly state: DatabaseInitializationState;
  readonly scope: MigrationScope;
  readonly baselineVersion: string;
  readonly currentVersion: string | null;
  readonly missingTables: readonly string[];
  readonly pendingMigrations: readonly string[];
}

export interface EnsureDatabaseResult {
  readonly status: "READY" | "INITIALIZED" | "UPGRADE_REQUIRED";
  readonly scope: MigrationScope;
  readonly baselineVersion: string;
  readonly currentVersion: string | null;
  readonly appliedBaseline: boolean;
  readonly pendingMigrations: readonly string[];
  readonly durationMs: number;
}

export interface PlatformBootstrapAdminInput {
  readonly email: string;
  readonly name: string;
  readonly password: string;
}
