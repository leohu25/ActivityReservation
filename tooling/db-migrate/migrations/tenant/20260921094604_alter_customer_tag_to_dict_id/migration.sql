-- AlterTable
ALTER TABLE "customer_tag" DROP COLUMN "tag_type",
ADD COLUMN     "tag_type_id" VARCHAR(60);

-- CreateIndex
CREATE INDEX "customer_tag_tag_type_id_idx" ON "customer_tag"("tag_type_id");

-- Comments Migration
COMMENT ON COLUMN "customer_tag"."tag_type_id" IS '业务标签类型ID：存储基础档案 tenant_dict_item 的主键 id (老表追加字段设为可选，应用层强制必填)';
