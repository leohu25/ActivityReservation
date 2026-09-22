-- DropIndex
DROP INDEX "tenant_dict_item_type_is_deleted_status_sort_idx";

-- AlterTable
ALTER TABLE "tenant_dict_item" DROP COLUMN "created_by_id",
DROP COLUMN "deleted_at",
DROP COLUMN "deleted_by_id",
DROP COLUMN "dept_id",
DROP COLUMN "is_deleted",
DROP COLUMN "updated_by_id";

-- DropTable
DROP TABLE "bom";

-- DropTable
DROP TABLE "bom_version";

-- DropTable
DROP TABLE "bom_version_input";

-- DropTable
DROP TABLE "bom_version_operation";

-- DropTable
DROP TABLE "bom_version_output";

-- DropTable
DROP TABLE "operation";

-- DropTable
DROP TABLE "processing_specification";

-- DropTable
DROP TABLE "product";

-- DropTable
DROP TABLE "product_category";

-- DropTable
DROP TABLE "product_default_bom";

-- DropTable
DROP TABLE "production_line";

-- DropTable
DROP TABLE "production_line_operation";

-- DropTable
DROP TABLE "production_line_warehouse";

-- DropTable
DROP TABLE "product_quality_grade";

-- DropTable
DROP TABLE "product_tag";

-- DropTable
DROP TABLE "product_unit_conversion";

-- DropTable
DROP TABLE "supplier";

-- DropTable
DROP TABLE "supplier_product";

-- DropTable
DROP TABLE "unit_of_measure";

-- DropTable
DROP TABLE "warehouse";

-- DropTable
DROP TABLE "warehouse_location";

-- DropTable
DROP TABLE "workshop";

-- CreateIndex
CREATE INDEX "tenant_dict_item_type_status_idx" ON "tenant_dict_item"("type", "status");