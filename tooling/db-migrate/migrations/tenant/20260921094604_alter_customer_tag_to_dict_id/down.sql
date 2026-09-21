-- DropIndex
DROP INDEX "customer_tag_tag_type_id_idx";

-- AlterTable
ALTER TABLE "customer_tag" DROP COLUMN "tag_type_id",
ADD COLUMN     "tag_type" VARCHAR(20) NOT NULL;

-- Comments Rollback
COMMENT ON COLUMN "customer_tag"."tag_type" IS '标签类型：DELIVERY(配送) / SETTLEMENT(结算) / CREDIT(信用) / OTHER(其他)';
