-- CreateTable
CREATE TABLE "platform_migration" (
    "version" VARCHAR(30) NOT NULL,
    "migration_name" VARCHAR(100) NOT NULL,
    "checksum" VARCHAR(64) NOT NULL,
    "applied_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_migration_pkey" PRIMARY KEY ("version")
);

-- Comments Migration
COMMENT ON TABLE "platform_migration" IS '平台总控库版本演进与迁移执行台账 (12-Factor 自愈基线账本)';
COMMENT ON COLUMN "platform_migration"."version" IS '迁移版本时间戳';
COMMENT ON COLUMN "platform_migration"."migration_name" IS '迁移名称或标识 (如 baseline)';
COMMENT ON COLUMN "platform_migration"."checksum" IS '迁移脚本 SHA-256 校验和';
COMMENT ON COLUMN "platform_migration"."applied_at" IS '迁移应用时间戳';
