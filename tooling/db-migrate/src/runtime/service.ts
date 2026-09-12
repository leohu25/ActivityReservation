import type {
  SecretResolver,
  TenantDatabaseSeeder,
  TenantSqlExecutorFactory,
} from "@base/db-tenant";
import type { TenantMigrationRepository } from "@base/db-control";
import { getMigrationCatalog } from "./catalog";
import { PlatformMigrationRunner } from "./platform-runner";
import { TenantMigrationRunner } from "./tenant-runner";
import { TenantDatabaseProvisioner } from "./provisioner";

export interface DatabaseMigrationServiceOptions {
  readonly controlDatabaseUrl: string;
  readonly repository: TenantMigrationRepository;
  readonly secretResolver: SecretResolver;
  readonly sqlExecutorFactory: TenantSqlExecutorFactory;
  readonly seeder?: TenantDatabaseSeeder;
}

export class DatabaseMigrationService {
  readonly platformRunner: PlatformMigrationRunner;
  readonly tenantRunner: TenantMigrationRunner;
  readonly tenantProvisioner: TenantDatabaseProvisioner;

  constructor(options: DatabaseMigrationServiceOptions) {
    const platformCatalog = getMigrationCatalog("platform");
    const tenantCatalog = getMigrationCatalog("tenant");
    this.platformRunner = new PlatformMigrationRunner(
      options.controlDatabaseUrl,
      platformCatalog,
    );
    this.tenantRunner = new TenantMigrationRunner(
      options.repository,
      options.secretResolver,
      options.sqlExecutorFactory,
      tenantCatalog,
    );
    this.tenantProvisioner = new TenantDatabaseProvisioner(
      options.repository,
      options.sqlExecutorFactory,
      tenantCatalog,
      options.seeder,
    );
  }
}
