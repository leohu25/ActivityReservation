-- 平台控制库初始基线迁移 (Baseline)
-- 包含统一 snake_case 的 Better Auth 认证表与租户物理库路由账本

CREATE TABLE IF NOT EXISTS "user" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "email_verified" BOOLEAN NOT NULL DEFAULT false,
  "image" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "user_email_key" ON "user"("email");

CREATE TABLE IF NOT EXISTS "session" (
  "id" TEXT NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "token" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ip_address" TEXT,
  "user_agent" TEXT,
  "user_id" TEXT NOT NULL,
  "active_organization_id" TEXT,
  CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "session_token_key" ON "session"("token");
CREATE INDEX IF NOT EXISTS "session_user_id_idx" ON "session"("user_id");
CREATE INDEX IF NOT EXISTS "session_active_organization_id_idx" ON "session"("active_organization_id");

CREATE TABLE IF NOT EXISTS "account" (
  "id" TEXT NOT NULL,
  "account_id" TEXT NOT NULL,
  "provider_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "access_token" TEXT,
  "refresh_token" TEXT,
  "id_token" TEXT,
  "access_token_expires_at" TIMESTAMP(3),
  "refreshToken_expires_at" TIMESTAMP(3),
  "scope" TEXT,
  "password" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "account_provider_id_account_id_key" ON "account"("provider_id", "account_id");
CREATE INDEX IF NOT EXISTS "account_user_id_idx" ON "account"("user_id");

CREATE TABLE IF NOT EXISTS "verification" (
  "id" TEXT NOT NULL,
  "identifier" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "verification_identifier_idx" ON "verification"("identifier");

CREATE TABLE IF NOT EXISTS "organization" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "logo" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "metadata" TEXT,
  "authorization_version" INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT "organization_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "organization_slug_key" ON "organization"("slug");

CREATE TABLE IF NOT EXISTS "member" (
  "id" TEXT NOT NULL,
  "organization_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'member',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "member_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "member_organization_id_user_id_key" ON "member"("organization_id", "user_id");
CREATE INDEX IF NOT EXISTS "member_user_id_idx" ON "member"("user_id");

CREATE TABLE IF NOT EXISTS "invitation" (
  "id" TEXT NOT NULL,
  "organization_id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "role" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "expires_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "inviter_id" TEXT NOT NULL,
  CONSTRAINT "invitation_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "invitation_organization_id_idx" ON "invitation"("organization_id");
CREATE INDEX IF NOT EXISTS "invitation_email_idx" ON "invitation"("email");

CREATE TABLE IF NOT EXISTS "organization_role" (
  "id" TEXT NOT NULL,
  "organization_id" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "permission" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3),
  CONSTRAINT "organization_role_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "organization_role_organization_id_role_key" ON "organization_role"("organization_id", "role");
CREATE INDEX IF NOT EXISTS "organization_role_organization_id_idx" ON "organization_role"("organization_id");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TenantDatabaseStatus') THEN
    CREATE TYPE "TenantDatabaseStatus" AS ENUM ('PROVISIONING', 'ACTIVE', 'SUSPENDED', 'FAILED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TenantMigrationStatus') THEN
    CREATE TYPE "TenantMigrationStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED', 'ROLLED_BACK');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "tenant_database" (
  "id" TEXT NOT NULL,
  "organization_id" TEXT NOT NULL,
  "cluster_code" TEXT NOT NULL,
  "database_name" TEXT NOT NULL,
  "secret_ref" TEXT NOT NULL,
  "schema_version" TEXT NOT NULL,
  "status" "TenantDatabaseStatus" NOT NULL DEFAULT 'PROVISIONING',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "tenant_database_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "tenant_database_organization_id_key" ON "tenant_database"("organization_id");
CREATE INDEX IF NOT EXISTS "tenant_database_cluster_code_status_idx" ON "tenant_database"("cluster_code", "status");

CREATE TABLE IF NOT EXISTS "tenant_migration" (
  "id" TEXT NOT NULL,
  "organization_id" TEXT NOT NULL,
  "migration_name" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "batch_id" TEXT,
  "status" "TenantMigrationStatus" NOT NULL DEFAULT 'PENDING',
  "applied_steps" INTEGER NOT NULL DEFAULT 0,
  "error_message" TEXT,
  "execution_time_ms" INTEGER,
  "started_at" TIMESTAMP(3),
  "finished_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "tenant_migration_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "tenant_migration_organization_id_idx" ON "tenant_migration"("organization_id");
CREATE INDEX IF NOT EXISTS "tenant_migration_status_idx" ON "tenant_migration"("status");
CREATE INDEX IF NOT EXISTS "tenant_migration_batch_id_idx" ON "tenant_migration"("batch_id");
CREATE INDEX IF NOT EXISTS "tenant_migration_organization_id_version_idx" ON "tenant_migration"("organization_id", "version");
