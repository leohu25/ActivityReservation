-- AlterTable
ALTER TABLE "customer_category" ADD COLUMN     "created_by_id" UUID NOT NULL DEFAULT '00000000-0000-7000-8000-000000000000',
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "deleted_by_id" UUID,
ADD COLUMN     "dept_id" UUID,
ADD COLUMN     "is_deleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "updated_by_id" UUID;

-- AlterTable
ALTER TABLE "customer_tag" ADD COLUMN     "created_by_id" UUID NOT NULL DEFAULT '00000000-0000-7000-8000-000000000000',
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "deleted_by_id" UUID,
ADD COLUMN     "dept_id" UUID,
ADD COLUMN     "is_deleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "updated_by_id" UUID;

-- CreateIndex
CREATE INDEX "bom_dept_id_idx" ON "bom"("dept_id");

-- CreateIndex
CREATE INDEX "bom_version_dept_id_idx" ON "bom_version"("dept_id");

-- CreateIndex
CREATE INDEX "customer_dept_id_idx" ON "customer"("dept_id");

-- CreateIndex
CREATE INDEX "customer_category_dept_id_idx" ON "customer_category"("dept_id");

-- CreateIndex
CREATE INDEX "customer_category_is_deleted_idx" ON "customer_category"("is_deleted");

-- CreateIndex
CREATE INDEX "customer_tag_dept_id_idx" ON "customer_tag"("dept_id");

-- CreateIndex
CREATE INDEX "customer_tag_is_deleted_idx" ON "customer_tag"("is_deleted");

-- CreateIndex
CREATE INDEX "product_dept_id_idx" ON "product"("dept_id");

-- CreateIndex
CREATE INDEX "product_category_dept_id_idx" ON "product_category"("dept_id");

-- CreateIndex
CREATE INDEX "product_default_bom_dept_id_idx" ON "product_default_bom"("dept_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_default_bom_product_id_bom_id_key" ON "product_default_bom"("product_id", "bom_id");

-- Comments Migration
COMMENT ON COLUMN "customer_category"."created_by_id" IS '创建人用户ID (UUIDv7)';
COMMENT ON COLUMN "customer_category"."dept_id" IS '归属部门ID (UUIDv7)';
COMMENT ON COLUMN "customer_category"."updated_by_id" IS '最后更新人用户ID (UUIDv7)';
COMMENT ON COLUMN "customer_category"."is_deleted" IS '软删除标记 (默认 false)';
COMMENT ON COLUMN "customer_category"."deleted_at" IS '软删除时间';
COMMENT ON COLUMN "customer_category"."deleted_by_id" IS '软删除操作人用户ID (UUIDv7)';
COMMENT ON COLUMN "customer_tag"."created_by_id" IS '创建人用户ID (UUIDv7)';
COMMENT ON COLUMN "customer_tag"."dept_id" IS '归属部门ID (UUIDv7)';
COMMENT ON COLUMN "customer_tag"."updated_by_id" IS '最后更新人用户ID (UUIDv7)';
COMMENT ON COLUMN "customer_tag"."is_deleted" IS '软删除标记 (默认 false)';
COMMENT ON COLUMN "customer_tag"."deleted_at" IS '软删除时间';
COMMENT ON COLUMN "customer_tag"."deleted_by_id" IS '软删除操作人用户ID (UUIDv7)';
