-- DropIndex
DROP INDEX "bom_dept_id_idx";

-- DropIndex
DROP INDEX "bom_version_dept_id_idx";

-- DropIndex
DROP INDEX "customer_dept_id_idx";

-- DropIndex
DROP INDEX "customer_category_dept_id_idx";

-- DropIndex
DROP INDEX "customer_category_is_deleted_idx";

-- DropIndex
DROP INDEX "customer_tag_dept_id_idx";

-- DropIndex
DROP INDEX "customer_tag_is_deleted_idx";

-- DropIndex
DROP INDEX "product_dept_id_idx";

-- DropIndex
DROP INDEX "product_category_dept_id_idx";

-- DropIndex
DROP INDEX "product_default_bom_dept_id_idx";

-- DropIndex
DROP INDEX "product_default_bom_product_id_bom_id_key";

-- AlterTable
ALTER TABLE "customer_category" DROP COLUMN "created_by_id",
DROP COLUMN "deleted_at",
DROP COLUMN "deleted_by_id",
DROP COLUMN "dept_id",
DROP COLUMN "is_deleted",
DROP COLUMN "updated_by_id";

-- AlterTable
ALTER TABLE "customer_tag" DROP COLUMN "created_by_id",
DROP COLUMN "deleted_at",
DROP COLUMN "deleted_by_id",
DROP COLUMN "dept_id",
DROP COLUMN "is_deleted",
DROP COLUMN "updated_by_id";