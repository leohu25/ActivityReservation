-- AlterTable
ALTER TABLE "employee_profile" ADD COLUMN     "avatar_url" TEXT;

-- CreateTable
CREATE TABLE "attachment" (
    "id" VARCHAR(36) NOT NULL,
    "module" VARCHAR(50) NOT NULL,
    "target_id" VARCHAR(64),
    "field_key" VARCHAR(50),
    "file_name" VARCHAR(255) NOT NULL,
    "storage_key" VARCHAR(500) NOT NULL,
    "file_url" VARCHAR(1000) NOT NULL,
    "file_size" BIGINT NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "created_by_id" VARCHAR(64) NOT NULL DEFAULT 'system',
    "dept_id" VARCHAR(64),
    "updated_by_id" VARCHAR(64),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "deleted_by_id" VARCHAR(64),

    CONSTRAINT "attachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "attachment_target_id_module_idx" ON "attachment"("target_id", "module");

-- CreateIndex
CREATE INDEX "attachment_created_by_id_idx" ON "attachment"("created_by_id");

-- Comments Migration
COMMENT ON TABLE "attachment" IS '通用业务附件元数据模型 (Tenant DB 物理隔离，严格对齐 ADR-009 实体审计基线)';
COMMENT ON COLUMN "attachment"."id" IS '附件主键ID';
COMMENT ON COLUMN "attachment"."module" IS '归属业务模块 (如 employee, customer, item 等)';
COMMENT ON COLUMN "attachment"."target_id" IS '关联业务实体主键ID (如员工档案ID、客户ID)';
COMMENT ON COLUMN "attachment"."field_key" IS '业务字段标识 (如 avatar, id_card, attachment 等)';
COMMENT ON COLUMN "attachment"."file_name" IS '原始文件名';
COMMENT ON COLUMN "attachment"."storage_key" IS '对象存储内部 Key';
COMMENT ON COLUMN "attachment"."file_url" IS '访问 URL';
COMMENT ON COLUMN "attachment"."file_size" IS '文件大小 (字节)';
COMMENT ON COLUMN "attachment"."mime_type" IS 'MIME 类型';
COMMENT ON COLUMN "attachment"."created_by_id" IS '创建人 ID (必填，审计基线)';
COMMENT ON COLUMN "attachment"."dept_id" IS '归属部门 ID (选填，支持部门数据范围权限过滤)';
COMMENT ON COLUMN "attachment"."updated_by_id" IS '更新人 ID (选填)';
COMMENT ON COLUMN "attachment"."created_at" IS '创建时间 (必填)';
COMMENT ON COLUMN "attachment"."updated_at" IS '更新时间 (必填)';
COMMENT ON COLUMN "attachment"."is_deleted" IS '软删除标记 (必填)';
COMMENT ON COLUMN "attachment"."deleted_at" IS '软删除时间 (选填)';
COMMENT ON COLUMN "attachment"."deleted_by_id" IS '软删除人 ID (选填)';
COMMENT ON COLUMN "employee_profile"."avatar_url" IS '员工头像/工牌照 URL';
