-- DropIndex
DROP INDEX "tenant_dict_item_type_status_idx";

-- AlterTable
ALTER TABLE "tenant_dict_item" ADD COLUMN     "created_by_id" UUID NOT NULL DEFAULT '00000000-0000-7000-8000-000000000000',
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "deleted_by_id" UUID,
ADD COLUMN     "dept_id" UUID,
ADD COLUMN     "is_deleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "updated_by_id" UUID;

-- CreateTable
CREATE TABLE "bom" (
    "id" UUID NOT NULL,
    "current_published_version_id" UUID,
    "lifecycle_status" VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
    "created_by_id" UUID NOT NULL DEFAULT '00000000-0000-7000-8000-000000000000',
    "dept_id" UUID,
    "updated_by_id" UUID,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "deleted_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bom_version" (
    "id" UUID NOT NULL,
    "bom_id" UUID NOT NULL,
    "based_on_version_id" UUID,
    "version_number" INTEGER NOT NULL,
    "version_status" VARCHAR(16) NOT NULL DEFAULT 'DRAFT',
    "code" VARCHAR(64) NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "bom_type" VARCHAR(24) NOT NULL,
    "description" TEXT,
    "production_line_id" UUID,
    "quantity_mode" VARCHAR(16) NOT NULL DEFAULT 'FIXED',
    "total_yield_enabled" BOOLEAN NOT NULL DEFAULT false,
    "total_yield_rate" DECIMAL(12,8),
    "default_cooked_yield_rate" DECIMAL(12,8),
    "minimum_batch_quantity" DECIMAL(20,6),
    "minimum_batch_unit_id" UUID,
    "effective_from" TIMESTAMP(3),
    "effective_to" TIMESTAMP(3),
    "change_reason" TEXT,
    "published_by_id" UUID,
    "published_at" TIMESTAMP(3),
    "row_version" INTEGER NOT NULL DEFAULT 0,
    "created_by_id" UUID NOT NULL DEFAULT '00000000-0000-7000-8000-000000000000',
    "dept_id" UUID,
    "updated_by_id" UUID,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "deleted_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bom_version_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bom_version_input" (
    "id" UUID NOT NULL,
    "bom_version_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity" DECIMAL(20,6),
    "unit_id" UUID NOT NULL,
    "ratio" DECIMAL(12,8),
    "material_role" VARCHAR(24) NOT NULL DEFAULT 'MAIN',
    "cooked_yield_rate" DECIMAL(12,8),
    "normal_loss_rate" DECIMAL(12,8),
    "supply_policy" VARCHAR(24) NOT NULL DEFAULT 'EXTERNAL',
    "child_bom_id" UUID,
    "child_bom_version_id" UUID,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "remark" VARCHAR(255),
    "created_by_id" UUID NOT NULL DEFAULT '00000000-0000-7000-8000-000000000000',
    "dept_id" UUID,
    "updated_by_id" UUID,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "deleted_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bom_version_input_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bom_version_operation" (
    "id" UUID NOT NULL,
    "bom_version_id" UUID NOT NULL,
    "operation_id" UUID NOT NULL,
    "processing_specification_id" UUID,
    "sequence_number" INTEGER NOT NULL,
    "setup_minutes" INTEGER,
    "cleanup_minutes" INTEGER,
    "standard_labor_hours" DECIMAL(12,4),
    "quality_checkpoint" BOOLEAN NOT NULL DEFAULT false,
    "instruction_text" TEXT,
    "instruction_parameters" JSONB,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "remark" VARCHAR(255),
    "created_by_id" UUID NOT NULL DEFAULT '00000000-0000-7000-8000-000000000000',
    "dept_id" UUID,
    "updated_by_id" UUID,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "deleted_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bom_version_operation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bom_version_output" (
    "id" UUID NOT NULL,
    "bom_version_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity" DECIMAL(20,6) NOT NULL,
    "unit_id" UUID NOT NULL,
    "output_role" VARCHAR(24) NOT NULL DEFAULT 'PRIMARY',
    "cost_allocation_ratio" DECIMAL(12,8),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "remark" VARCHAR(255),
    "created_by_id" UUID NOT NULL DEFAULT '00000000-0000-7000-8000-000000000000',
    "dept_id" UUID,
    "updated_by_id" UUID,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "deleted_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bom_version_output_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operation" (
    "id" UUID NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "operation_category_dict_item_id" UUID NOT NULL,
    "default_setup_minutes" INTEGER NOT NULL DEFAULT 0,
    "default_cleanup_minutes" INTEGER NOT NULL DEFAULT 0,
    "default_yield_rate" DECIMAL(12,8),
    "minimum_operator_count" INTEGER,
    "minimum_batch_quantity" DECIMAL(20,6),
    "minimum_batch_unit_id" UUID,
    "sop_text" TEXT,
    "status" VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
    "created_by_id" UUID NOT NULL DEFAULT '00000000-0000-7000-8000-000000000000',
    "dept_id" UUID,
    "updated_by_id" UUID,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "deleted_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "operation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "processing_specification" (
    "id" UUID NOT NULL,
    "operation_id" UUID NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "description" TEXT,
    "default_yield_rate" DECIMAL(12,8),
    "status" VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
    "created_by_id" UUID NOT NULL DEFAULT '00000000-0000-7000-8000-000000000000',
    "dept_id" UUID,
    "updated_by_id" UUID,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "deleted_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "processing_specification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product" (
    "id" UUID NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "alias" VARCHAR(256),
    "product_category_id" UUID NOT NULL,
    "inventory_unit_id" UUID NOT NULL,
    "default_purchase_unit_id" UUID,
    "default_production_unit_id" UUID,
    "default_sales_unit_id" UUID,
    "temperature_zone_dict_item_id" UUID,
    "processing_form_dict_item_id" UUID,
    "supply_mode" VARCHAR(24) NOT NULL DEFAULT 'PURCHASE',
    "product_kind" VARCHAR(24) NOT NULL DEFAULT 'MATERIAL',
    "shelf_life_days" INTEGER,
    "batch_managed" BOOLEAN NOT NULL DEFAULT false,
    "quantity_precision" SMALLINT NOT NULL DEFAULT 2,
    "minimum_purchase_quantity" DECIMAL(20,6),
    "minimum_sales_quantity" DECIMAL(20,6),
    "maximum_sales_quantity" DECIMAL(20,6),
    "minimum_production_quantity" DECIMAL(20,6),
    "acceptance_standard" TEXT,
    "image_file_asset_id" UUID,
    "reference_price" DECIMAL(20,6),
    "source" VARCHAR(16) NOT NULL DEFAULT 'MANUAL',
    "status" VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
    "created_by_id" UUID NOT NULL DEFAULT '00000000-0000-7000-8000-000000000000',
    "dept_id" UUID,
    "updated_by_id" UUID,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "deleted_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_category" (
    "id" UUID NOT NULL,
    "parent_product_category_id" UUID,
    "code" VARCHAR(64) NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "icon_file_asset_id" UUID,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "status" VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
    "created_by_id" UUID NOT NULL DEFAULT '00000000-0000-7000-8000-000000000000',
    "dept_id" UUID,
    "updated_by_id" UUID,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "deleted_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_default_bom" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "bom_id" UUID NOT NULL,
    "created_by_id" UUID NOT NULL DEFAULT '00000000-0000-7000-8000-000000000000',
    "dept_id" UUID,
    "updated_by_id" UUID,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "deleted_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_default_bom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_line" (
    "id" UUID NOT NULL,
    "workshop_id" UUID NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "minimum_batch_quantity" DECIMAL(20,6),
    "minimum_batch_unit_id" UUID,
    "status" VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
    "created_by_id" UUID NOT NULL DEFAULT '00000000-0000-7000-8000-000000000000',
    "dept_id" UUID,
    "updated_by_id" UUID,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "deleted_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "production_line_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_line_operation" (
    "id" UUID NOT NULL,
    "production_line_id" UUID NOT NULL,
    "operation_id" UUID NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "setup_minutes" INTEGER,
    "cleanup_minutes" INTEGER,
    "created_by_id" UUID NOT NULL DEFAULT '00000000-0000-7000-8000-000000000000',
    "dept_id" UUID,
    "updated_by_id" UUID,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "deleted_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "production_line_operation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_line_warehouse" (
    "id" UUID NOT NULL,
    "production_line_id" UUID NOT NULL,
    "warehouse_id" UUID NOT NULL,
    "warehouse_role" VARCHAR(24) NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_by_id" UUID NOT NULL DEFAULT '00000000-0000-7000-8000-000000000000',
    "dept_id" UUID,
    "updated_by_id" UUID,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "deleted_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "production_line_warehouse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_quality_grade" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quality_grade_dict_item_id" UUID NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_by_id" UUID NOT NULL DEFAULT '00000000-0000-7000-8000-000000000000',
    "dept_id" UUID,
    "updated_by_id" UUID,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "deleted_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_quality_grade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_tag" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "tag_dict_item_id" UUID NOT NULL,
    "created_by_id" UUID NOT NULL DEFAULT '00000000-0000-7000-8000-000000000000',
    "dept_id" UUID,
    "updated_by_id" UUID,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "deleted_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_unit_conversion" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "from_unit_id" UUID NOT NULL,
    "to_unit_id" UUID NOT NULL,
    "conversion_factor" DECIMAL(20,10) NOT NULL,
    "effective_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effective_to" TIMESTAMP(3),
    "status" VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
    "created_by_id" UUID NOT NULL DEFAULT '00000000-0000-7000-8000-000000000000',
    "dept_id" UUID,
    "updated_by_id" UUID,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "deleted_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_unit_conversion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier" (
    "id" UUID NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "short_name" VARCHAR(64),
    "contact_name" VARCHAR(64),
    "contact_phone" VARCHAR(32),
    "remark" VARCHAR(255),
    "status" VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
    "created_by_id" UUID NOT NULL DEFAULT '00000000-0000-7000-8000-000000000000',
    "dept_id" UUID,
    "updated_by_id" UUID,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "deleted_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_product" (
    "id" UUID NOT NULL,
    "supplier_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "supplier_product_code" VARCHAR(128),
    "purchase_unit_id" UUID NOT NULL,
    "minimum_order_quantity" DECIMAL(20,6),
    "lead_time_hours" INTEGER,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "status" VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
    "created_by_id" UUID NOT NULL DEFAULT '00000000-0000-7000-8000-000000000000',
    "dept_id" UUID,
    "updated_by_id" UUID,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "deleted_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unit_of_measure" (
    "id" UUID NOT NULL,
    "code" VARCHAR(32) NOT NULL,
    "name" VARCHAR(64) NOT NULL,
    "dimension_dict_item_id" UUID NOT NULL,
    "base_factor" DECIMAL(20,10),
    "decimal_places" SMALLINT NOT NULL DEFAULT 2,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "status" VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
    "created_by_id" UUID NOT NULL DEFAULT '00000000-0000-7000-8000-000000000000',
    "dept_id" UUID,
    "updated_by_id" UUID,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "deleted_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "unit_of_measure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouse" (
    "id" UUID NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "warehouse_type_dict_item_id" UUID NOT NULL,
    "temperature_zone_dict_item_id" UUID,
    "status" VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
    "created_by_id" UUID NOT NULL DEFAULT '00000000-0000-7000-8000-000000000000',
    "dept_id" UUID,
    "updated_by_id" UUID,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "deleted_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warehouse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouse_location" (
    "id" UUID NOT NULL,
    "warehouse_id" UUID NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "zone" VARCHAR(64),
    "shelf" VARCHAR(64),
    "layer" VARCHAR(64),
    "position" VARCHAR(64),
    "temperature_zone_dict_item_id" UUID,
    "status" VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
    "created_by_id" UUID NOT NULL DEFAULT '00000000-0000-7000-8000-000000000000',
    "dept_id" UUID,
    "updated_by_id" UUID,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "deleted_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warehouse_location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workshop" (
    "id" UUID NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "description" TEXT,
    "status" VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
    "created_by_id" UUID NOT NULL DEFAULT '00000000-0000-7000-8000-000000000000',
    "dept_id" UUID,
    "updated_by_id" UUID,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "deleted_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workshop_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bom_current_published_version_id_key" ON "bom"("current_published_version_id");

-- CreateIndex
CREATE INDEX "bom_lifecycle_status_is_deleted_idx" ON "bom"("lifecycle_status", "is_deleted");

-- CreateIndex
CREATE INDEX "bom_version_bom_id_version_status_effective_from_idx" ON "bom_version"("bom_id", "version_status", "effective_from");

-- CreateIndex
CREATE INDEX "bom_version_code_version_status_is_deleted_idx" ON "bom_version"("code", "version_status", "is_deleted");

-- CreateIndex
CREATE UNIQUE INDEX "bom_version_bom_id_version_number_key" ON "bom_version"("bom_id", "version_number");

-- CreateIndex
CREATE INDEX "bom_version_input_bom_version_id_sort_order_idx" ON "bom_version_input"("bom_version_id", "sort_order");

-- CreateIndex
CREATE INDEX "bom_version_input_product_id_idx" ON "bom_version_input"("product_id");

-- CreateIndex
CREATE INDEX "bom_version_input_child_bom_version_id_idx" ON "bom_version_input"("child_bom_version_id");

-- CreateIndex
CREATE INDEX "bom_version_operation_bom_version_id_sequence_number_idx" ON "bom_version_operation"("bom_version_id", "sequence_number");

-- CreateIndex
CREATE INDEX "bom_version_operation_operation_id_idx" ON "bom_version_operation"("operation_id");

-- CreateIndex
CREATE INDEX "bom_version_output_bom_version_id_output_role_sort_order_idx" ON "bom_version_output"("bom_version_id", "output_role", "sort_order");

-- CreateIndex
CREATE INDEX "bom_version_output_product_id_idx" ON "bom_version_output"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "operation_code_key" ON "operation"("code");

-- CreateIndex
CREATE INDEX "operation_operation_category_dict_item_id_status_idx" ON "operation"("operation_category_dict_item_id", "status");

-- CreateIndex
CREATE INDEX "operation_status_idx" ON "operation"("status");

-- CreateIndex
CREATE INDEX "processing_specification_operation_id_status_idx" ON "processing_specification"("operation_id", "status");

-- CreateIndex
CREATE INDEX "processing_specification_status_idx" ON "processing_specification"("status");

-- CreateIndex
CREATE UNIQUE INDEX "processing_specification_operation_id_code_key" ON "processing_specification"("operation_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "product_code_key" ON "product"("code");

-- CreateIndex
CREATE INDEX "product_product_category_id_is_deleted_status_idx" ON "product"("product_category_id", "is_deleted", "status");

-- CreateIndex
CREATE INDEX "product_product_kind_is_deleted_status_idx" ON "product"("product_kind", "is_deleted", "status");

-- CreateIndex
CREATE INDEX "product_inventory_unit_id_idx" ON "product"("inventory_unit_id");

-- CreateIndex
CREATE INDEX "product_status_idx" ON "product"("status");

-- CreateIndex
CREATE UNIQUE INDEX "product_category_code_key" ON "product_category"("code");

-- CreateIndex
CREATE INDEX "product_category_parent_product_category_id_idx" ON "product_category"("parent_product_category_id");

-- CreateIndex
CREATE INDEX "product_category_status_idx" ON "product_category"("status");

-- CreateIndex
CREATE INDEX "product_default_bom_product_id_is_deleted_idx" ON "product_default_bom"("product_id", "is_deleted");

-- CreateIndex
CREATE INDEX "product_default_bom_bom_id_is_deleted_idx" ON "product_default_bom"("bom_id", "is_deleted");

-- CreateIndex
CREATE UNIQUE INDEX "production_line_code_key" ON "production_line"("code");

-- CreateIndex
CREATE INDEX "production_line_workshop_id_status_idx" ON "production_line"("workshop_id", "status");

-- CreateIndex
CREATE INDEX "production_line_status_idx" ON "production_line"("status");

-- CreateIndex
CREATE INDEX "production_line_operation_operation_id_idx" ON "production_line_operation"("operation_id");

-- CreateIndex
CREATE UNIQUE INDEX "production_line_operation_production_line_id_operation_id_key" ON "production_line_operation"("production_line_id", "operation_id");

-- CreateIndex
CREATE INDEX "production_line_warehouse_production_line_id_warehouse_role_idx" ON "production_line_warehouse"("production_line_id", "warehouse_role");

-- CreateIndex
CREATE INDEX "production_line_warehouse_warehouse_id_idx" ON "production_line_warehouse"("warehouse_id");

-- CreateIndex
CREATE UNIQUE INDEX "production_line_warehouse_production_line_id_warehouse_id_w_key" ON "production_line_warehouse"("production_line_id", "warehouse_id", "warehouse_role");

-- CreateIndex
CREATE INDEX "product_quality_grade_quality_grade_dict_item_id_idx" ON "product_quality_grade"("quality_grade_dict_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_quality_grade_product_id_quality_grade_dict_item_id_key" ON "product_quality_grade"("product_id", "quality_grade_dict_item_id");

-- CreateIndex
CREATE INDEX "product_tag_tag_dict_item_id_idx" ON "product_tag"("tag_dict_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_tag_product_id_tag_dict_item_id_key" ON "product_tag"("product_id", "tag_dict_item_id");

-- CreateIndex
CREATE INDEX "product_unit_conversion_product_id_from_unit_id_to_unit_id_idx" ON "product_unit_conversion"("product_id", "from_unit_id", "to_unit_id");

-- CreateIndex
CREATE INDEX "product_unit_conversion_status_idx" ON "product_unit_conversion"("status");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_code_key" ON "supplier"("code");

-- CreateIndex
CREATE INDEX "supplier_status_idx" ON "supplier"("status");

-- CreateIndex
CREATE INDEX "supplier_product_product_id_status_idx" ON "supplier_product"("product_id", "status");

-- CreateIndex
CREATE INDEX "supplier_product_status_idx" ON "supplier_product"("status");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_product_supplier_id_product_id_key" ON "supplier_product"("supplier_id", "product_id");

-- CreateIndex
CREATE UNIQUE INDEX "unit_of_measure_code_key" ON "unit_of_measure"("code");

-- CreateIndex
CREATE INDEX "unit_of_measure_dimension_dict_item_id_status_idx" ON "unit_of_measure"("dimension_dict_item_id", "status");

-- CreateIndex
CREATE INDEX "unit_of_measure_status_idx" ON "unit_of_measure"("status");

-- CreateIndex
CREATE UNIQUE INDEX "warehouse_code_key" ON "warehouse"("code");

-- CreateIndex
CREATE INDEX "warehouse_warehouse_type_dict_item_id_status_idx" ON "warehouse"("warehouse_type_dict_item_id", "status");

-- CreateIndex
CREATE INDEX "warehouse_status_idx" ON "warehouse"("status");

-- CreateIndex
CREATE INDEX "warehouse_location_warehouse_id_status_idx" ON "warehouse_location"("warehouse_id", "status");

-- CreateIndex
CREATE INDEX "warehouse_location_status_idx" ON "warehouse_location"("status");

-- CreateIndex
CREATE UNIQUE INDEX "warehouse_location_warehouse_id_code_key" ON "warehouse_location"("warehouse_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "workshop_code_key" ON "workshop"("code");

-- CreateIndex
CREATE INDEX "workshop_status_idx" ON "workshop"("status");

-- CreateIndex
CREATE INDEX "tenant_dict_item_type_is_deleted_status_sort_idx" ON "tenant_dict_item"("type", "is_deleted", "status", "sort");

-- Comments Migration
COMMENT ON TABLE "bom" IS 'BOM 版本族身份表 (同一套生产方案的稳定容器)';
COMMENT ON COLUMN "bom"."id" IS '主键ID (UUIDv7，稳定版本族身份)';
COMMENT ON COLUMN "bom"."current_published_version_id" IS '当前发布生效的 BOM 版本ID';
COMMENT ON COLUMN "bom"."lifecycle_status" IS '版本族生命周期状态: ACTIVE(正常) / ARCHIVED(已归档)';
COMMENT ON COLUMN "bom"."created_by_id" IS '创建人用户ID (UUIDv7)';
COMMENT ON COLUMN "bom"."dept_id" IS '归属部门ID (UUIDv7)';
COMMENT ON COLUMN "bom"."updated_by_id" IS '最后更新人用户ID (UUIDv7)';
COMMENT ON COLUMN "bom"."is_deleted" IS '软删除标记 (默认 false)';
COMMENT ON COLUMN "bom"."deleted_at" IS '软删除时间';
COMMENT ON COLUMN "bom"."deleted_by_id" IS '软删除操作人用户ID (UUIDv7)';
COMMENT ON COLUMN "bom"."created_at" IS '创建时间';
COMMENT ON COLUMN "bom"."updated_at" IS '更新时间';
COMMENT ON TABLE "bom_version" IS 'BOM 完整版本表 (发布后不可变的生产方案快照)';
COMMENT ON COLUMN "bom_version"."id" IS '主键ID (UUIDv7，单次发布版本身份)';
COMMENT ON COLUMN "bom_version"."bom_id" IS '所属 BOM 版本族ID';
COMMENT ON COLUMN "bom_version"."based_on_version_id" IS '复制来源版本ID (记录衍生链条)';
COMMENT ON COLUMN "bom_version"."version_number" IS '版本序号数字 (如 1, 2, 3)';
COMMENT ON COLUMN "bom_version"."version_status" IS '版本状态: DRAFT(草稿) / PUBLISHED(已发布) / RETIRED(已废止)';
COMMENT ON COLUMN "bom_version"."code" IS '本版本 BOM 业务编码';
COMMENT ON COLUMN "bom_version"."name" IS '本版本 BOM 名称';
COMMENT ON COLUMN "bom_version"."bom_type" IS 'BOM 业务类型: PROCESSING(单品加工) / FORMULA(组合配方) / PACKAGING(包装装配)';
COMMENT ON COLUMN "bom_version"."description" IS '版本描述与配方说明';
COMMENT ON COLUMN "bom_version"."production_line_id" IS '指定生产产线ID (选填)';
COMMENT ON COLUMN "bom_version"."quantity_mode" IS '数量模式: FIXED(固定数量) / RATIO(比例配方)';
COMMENT ON COLUMN "bom_version"."total_yield_enabled" IS '是否启用总出成率控制';
COMMENT ON COLUMN "bom_version"."total_yield_rate" IS '总出成率数值 (0~1)';
COMMENT ON COLUMN "bom_version"."default_cooked_yield_rate" IS '投入行默认熟出成率参考值';
COMMENT ON COLUMN "bom_version"."minimum_batch_quantity" IS '本版本最小生产批量';
COMMENT ON COLUMN "bom_version"."minimum_batch_unit_id" IS '最小批量单位ID (关联 UnitOfMeasure.id)';
COMMENT ON COLUMN "bom_version"."effective_from" IS '生效时间';
COMMENT ON COLUMN "bom_version"."effective_to" IS '失效时间';
COMMENT ON COLUMN "bom_version"."change_reason" IS '版本变更原因';
COMMENT ON COLUMN "bom_version"."published_by_id" IS '发布人用户ID';
COMMENT ON COLUMN "bom_version"."published_at" IS '发布时间戳';
COMMENT ON COLUMN "bom_version"."row_version" IS '乐观锁版本号';
COMMENT ON COLUMN "bom_version"."created_by_id" IS '创建人用户ID (UUIDv7)';
COMMENT ON COLUMN "bom_version"."dept_id" IS '归属部门ID (UUIDv7)';
COMMENT ON COLUMN "bom_version"."updated_by_id" IS '最后更新人用户ID (UUIDv7)';
COMMENT ON COLUMN "bom_version"."is_deleted" IS '软删除标记 (默认 false)';
COMMENT ON COLUMN "bom_version"."deleted_at" IS '软删除时间';
COMMENT ON COLUMN "bom_version"."deleted_by_id" IS '软删除操作人用户ID (UUIDv7)';
COMMENT ON COLUMN "bom_version"."created_at" IS '创建时间';
COMMENT ON COLUMN "bom_version"."updated_at" IS '更新时间';
COMMENT ON TABLE "bom_version_input" IS 'BOM 版本标准投入清单表 (用什么、用多少)';
COMMENT ON COLUMN "bom_version_input"."id" IS '主键ID (UUIDv7)';
COMMENT ON COLUMN "bom_version_input"."bom_version_id" IS '所属 BOM 完整版本ID';
COMMENT ON COLUMN "bom_version_input"."product_id" IS '投入物料商品ID (关联 Product.id)';
COMMENT ON COLUMN "bom_version_input"."quantity" IS '标准毛投入量 (FIXED 模式必填)';
COMMENT ON COLUMN "bom_version_input"."unit_id" IS '投入计量单位ID (关联 UnitOfMeasure.id)';
COMMENT ON COLUMN "bom_version_input"."ratio" IS '配方占比 (RATIO 模式必填，0~1)';
COMMENT ON COLUMN "bom_version_input"."material_role" IS '物料角色: MAIN(主料) / AUXILIARY(辅料) / PACKAGING(包材) / PROCESSING_AID(加工助剂)';
COMMENT ON COLUMN "bom_version_input"."cooked_yield_rate" IS '原料熟出成率参考值 (0~1)';
COMMENT ON COLUMN "bom_version_input"."normal_loss_rate" IS '正常损耗率参考值 (0~1)';
COMMENT ON COLUMN "bom_version_input"."supply_policy" IS '供应策略: EXTERNAL(外购) / MAKE(生产自制) / PRODUCT_DEFAULT(跟随商品默认方案)';
COMMENT ON COLUMN "bom_version_input"."child_bom_id" IS '草稿选定的下层子 BOM 族ID';
COMMENT ON COLUMN "bom_version_input"."child_bom_version_id" IS '发布时锁定的下层子 BOM 版本ID';
COMMENT ON COLUMN "bom_version_input"."sort_order" IS '页面展示排序';
COMMENT ON COLUMN "bom_version_input"."remark" IS '行备注说明';
COMMENT ON COLUMN "bom_version_input"."created_by_id" IS '创建人用户ID (UUIDv7)';
COMMENT ON COLUMN "bom_version_input"."dept_id" IS '归属部门ID (UUIDv7)';
COMMENT ON COLUMN "bom_version_input"."updated_by_id" IS '最后更新人用户ID (UUIDv7)';
COMMENT ON COLUMN "bom_version_input"."is_deleted" IS '软删除标记 (默认 false)';
COMMENT ON COLUMN "bom_version_input"."deleted_at" IS '软删除时间';
COMMENT ON COLUMN "bom_version_input"."deleted_by_id" IS '软删除操作人用户ID (UUIDv7)';
COMMENT ON COLUMN "bom_version_input"."created_at" IS '创建时间';
COMMENT ON COLUMN "bom_version_input"."updated_at" IS '更新时间';
COMMENT ON TABLE "bom_version_operation" IS 'BOM 版本有序工艺清单表 (怎么做、经过哪些工序)';
COMMENT ON COLUMN "bom_version_operation"."id" IS '主键ID (UUIDv7)';
COMMENT ON COLUMN "bom_version_operation"."bom_version_id" IS '所属 BOM 完整版本ID';
COMMENT ON COLUMN "bom_version_operation"."operation_id" IS '工序ID';
COMMENT ON COLUMN "bom_version_operation"."processing_specification_id" IS '选定的加工规格ID (选填)';
COMMENT ON COLUMN "bom_version_operation"."sequence_number" IS '工艺顺序号 (如 10, 20, 30)';
COMMENT ON COLUMN "bom_version_operation"."setup_minutes" IS '本版本覆盖准备时间 (分钟)';
COMMENT ON COLUMN "bom_version_operation"."cleanup_minutes" IS '本版本覆盖清理时间 (分钟)';
COMMENT ON COLUMN "bom_version_operation"."standard_labor_hours" IS '标准工时 (小时)';
COMMENT ON COLUMN "bom_version_operation"."quality_checkpoint" IS '是否质检控制点';
COMMENT ON COLUMN "bom_version_operation"."instruction_text" IS '本版本特定操作指引';
COMMENT ON COLUMN "bom_version_operation"."instruction_parameters" IS '差异化加工参数 (温度、时间、切刀尺寸等 JSON)';
COMMENT ON COLUMN "bom_version_operation"."sort_order" IS '页面展示排序';
COMMENT ON COLUMN "bom_version_operation"."remark" IS '行备注说明';
COMMENT ON COLUMN "bom_version_operation"."created_by_id" IS '创建人用户ID (UUIDv7)';
COMMENT ON COLUMN "bom_version_operation"."dept_id" IS '归属部门ID (UUIDv7)';
COMMENT ON COLUMN "bom_version_operation"."updated_by_id" IS '最后更新人用户ID (UUIDv7)';
COMMENT ON COLUMN "bom_version_operation"."is_deleted" IS '软删除标记 (默认 false)';
COMMENT ON COLUMN "bom_version_operation"."deleted_at" IS '软删除时间';
COMMENT ON COLUMN "bom_version_operation"."deleted_by_id" IS '软删除操作人用户ID (UUIDv7)';
COMMENT ON COLUMN "bom_version_operation"."created_at" IS '创建时间';
COMMENT ON COLUMN "bom_version_operation"."updated_at" IS '更新时间';
COMMENT ON TABLE "bom_version_output" IS 'BOM 版本标准产出清单表 (产什么、产多少；PRIMARY 唯一主产出即 BOM 商品)';
COMMENT ON COLUMN "bom_version_output"."id" IS '主键ID (UUIDv7)';
COMMENT ON COLUMN "bom_version_output"."bom_version_id" IS '所属 BOM 完整版本ID';
COMMENT ON COLUMN "bom_version_output"."product_id" IS '产出物料商品ID (关联 Product.id)';
COMMENT ON COLUMN "bom_version_output"."quantity" IS '标准批次产出数量';
COMMENT ON COLUMN "bom_version_output"."unit_id" IS '产出计量单位ID (关联 UnitOfMeasure.id)';
COMMENT ON COLUMN "bom_version_output"."output_role" IS '产出角色: PRIMARY(主产品，单版本严格唯一) / BYPRODUCT(联副产品)';
COMMENT ON COLUMN "bom_version_output"."cost_allocation_ratio" IS '成本分摊比例 (0~1)';
COMMENT ON COLUMN "bom_version_output"."sort_order" IS '页面展示排序';
COMMENT ON COLUMN "bom_version_output"."remark" IS '行备注说明';
COMMENT ON COLUMN "bom_version_output"."created_by_id" IS '创建人用户ID (UUIDv7)';
COMMENT ON COLUMN "bom_version_output"."dept_id" IS '归属部门ID (UUIDv7)';
COMMENT ON COLUMN "bom_version_output"."updated_by_id" IS '最后更新人用户ID (UUIDv7)';
COMMENT ON COLUMN "bom_version_output"."is_deleted" IS '软删除标记 (默认 false)';
COMMENT ON COLUMN "bom_version_output"."deleted_at" IS '软删除时间';
COMMENT ON COLUMN "bom_version_output"."deleted_by_id" IS '软删除操作人用户ID (UUIDv7)';
COMMENT ON COLUMN "bom_version_output"."created_at" IS '创建时间';
COMMENT ON COLUMN "bom_version_output"."updated_at" IS '更新时间';
COMMENT ON TABLE "operation" IS '工序主档表';
COMMENT ON COLUMN "operation"."id" IS '主键ID (UUIDv7)';
COMMENT ON COLUMN "operation"."code" IS '工序编码 (全表唯一)';
COMMENT ON COLUMN "operation"."name" IS '工序名称';
COMMENT ON COLUMN "operation"."operation_category_dict_item_id" IS '工序分类字典项ID (OPERATION_CATEGORY)';
COMMENT ON COLUMN "operation"."default_setup_minutes" IS '默认准备时间 (分钟)';
COMMENT ON COLUMN "operation"."default_cleanup_minutes" IS '默认清理时间 (分钟)';
COMMENT ON COLUMN "operation"."default_yield_rate" IS '默认参考出成率 (不直接参与发布BOM计算)';
COMMENT ON COLUMN "operation"."minimum_operator_count" IS '最少操作人数';
COMMENT ON COLUMN "operation"."minimum_batch_quantity" IS '工序默认最小批量';
COMMENT ON COLUMN "operation"."minimum_batch_unit_id" IS '最小批量单位ID (关联 UnitOfMeasure.id)';
COMMENT ON COLUMN "operation"."sop_text" IS '默认 SOP 操作说明';
COMMENT ON COLUMN "operation"."status" IS '状态: ACTIVE / DISABLED';
COMMENT ON COLUMN "operation"."created_by_id" IS '创建人用户ID (UUIDv7)';
COMMENT ON COLUMN "operation"."dept_id" IS '归属部门ID (UUIDv7)';
COMMENT ON COLUMN "operation"."updated_by_id" IS '最后更新人用户ID (UUIDv7)';
COMMENT ON COLUMN "operation"."is_deleted" IS '软删除标记 (默认 false)';
COMMENT ON COLUMN "operation"."deleted_at" IS '软删除时间';
COMMENT ON COLUMN "operation"."deleted_by_id" IS '软删除操作人用户ID (UUIDv7)';
COMMENT ON COLUMN "operation"."created_at" IS '创建时间';
COMMENT ON COLUMN "operation"."updated_at" IS '更新时间';
COMMENT ON TABLE "processing_specification" IS '加工规格表';
COMMENT ON COLUMN "processing_specification"."id" IS '主键ID (UUIDv7)';
COMMENT ON COLUMN "processing_specification"."operation_id" IS '所属工序ID';
COMMENT ON COLUMN "processing_specification"."code" IS '工序内规格编码 (如 CUT_SLICE_3MM)';
COMMENT ON COLUMN "processing_specification"."name" IS '规格名称 (如 切丝5mm、切片3mm)';
COMMENT ON COLUMN "processing_specification"."description" IS '加工说明';
COMMENT ON COLUMN "processing_specification"."default_yield_rate" IS '默认参考出成率';
COMMENT ON COLUMN "processing_specification"."status" IS '状态: ACTIVE / DISABLED';
COMMENT ON COLUMN "processing_specification"."created_by_id" IS '创建人用户ID (UUIDv7)';
COMMENT ON COLUMN "processing_specification"."dept_id" IS '归属部门ID (UUIDv7)';
COMMENT ON COLUMN "processing_specification"."updated_by_id" IS '最后更新人用户ID (UUIDv7)';
COMMENT ON COLUMN "processing_specification"."is_deleted" IS '软删除标记 (默认 false)';
COMMENT ON COLUMN "processing_specification"."deleted_at" IS '软删除时间';
COMMENT ON COLUMN "processing_specification"."deleted_by_id" IS '软删除操作人用户ID (UUIDv7)';
COMMENT ON COLUMN "processing_specification"."created_at" IS '创建时间';
COMMENT ON COLUMN "processing_specification"."updated_at" IS '更新时间';
COMMENT ON TABLE "product" IS '统一商品物料主档表 (原料、半成品、成品、包材共用)';
COMMENT ON COLUMN "product"."id" IS '主键ID (UUIDv7)';
COMMENT ON COLUMN "product"."code" IS '商品编码 (全表唯一)';
COMMENT ON COLUMN "product"."name" IS '商品名称';
COMMENT ON COLUMN "product"."alias" IS '搜索别名/助记码';
COMMENT ON COLUMN "product"."product_category_id" IS '所属商品品类ID';
COMMENT ON COLUMN "product"."inventory_unit_id" IS '库存核算基本单位ID';
COMMENT ON COLUMN "product"."default_purchase_unit_id" IS '默认采购单位ID';
COMMENT ON COLUMN "product"."default_production_unit_id" IS '默认生产单位ID';
COMMENT ON COLUMN "product"."default_sales_unit_id" IS '默认销售单位ID';
COMMENT ON COLUMN "product"."temperature_zone_dict_item_id" IS '温层分类字典项ID (TEMPERATURE_ZONE)';
COMMENT ON COLUMN "product"."processing_form_dict_item_id" IS '加工形态字典项ID (PRODUCT_PROCESSING_FORM)';
COMMENT ON COLUMN "product"."supply_mode" IS '供货模式: PURCHASE(外购) / MAKE(自制) / HYBRID(混合)';
COMMENT ON COLUMN "product"."product_kind" IS '物料类别: MATERIAL(原料) / SEMI_FINISHED(半成品) / FINISHED(成品) / PACKAGING(包材)';
COMMENT ON COLUMN "product"."shelf_life_days" IS '保质期天数';
COMMENT ON COLUMN "product"."batch_managed" IS '是否启用批次管理';
COMMENT ON COLUMN "product"."quantity_precision" IS '数量显示小数位数';
COMMENT ON COLUMN "product"."minimum_purchase_quantity" IS '最小采购量 (按默认采购单位)';
COMMENT ON COLUMN "product"."minimum_sales_quantity" IS '最小销售量 (按默认销售单位)';
COMMENT ON COLUMN "product"."maximum_sales_quantity" IS '最大销售量 (按默认销售单位)';
COMMENT ON COLUMN "product"."minimum_production_quantity" IS '最小生产批量 (按默认生产单位)';
COMMENT ON COLUMN "product"."acceptance_standard" IS '验收标准说明';
COMMENT ON COLUMN "product"."image_file_asset_id" IS '商品图片附件ID';
COMMENT ON COLUMN "product"."reference_price" IS '参考价格 (不作为成本唯一来源)';
COMMENT ON COLUMN "product"."source" IS '数据来源: MANUAL / SYSTEM / IMPORT';
COMMENT ON COLUMN "product"."status" IS '状态: ACTIVE(正常) / STOPPED(停售/停用) / ARCHIVED(归档)';
COMMENT ON COLUMN "product"."created_by_id" IS '创建人用户ID (UUIDv7)';
COMMENT ON COLUMN "product"."dept_id" IS '归属部门ID (UUIDv7)';
COMMENT ON COLUMN "product"."updated_by_id" IS '最后更新人用户ID (UUIDv7)';
COMMENT ON COLUMN "product"."is_deleted" IS '软删除标记 (默认 false)';
COMMENT ON COLUMN "product"."deleted_at" IS '软删除时间';
COMMENT ON COLUMN "product"."deleted_by_id" IS '软删除操作人用户ID (UUIDv7)';
COMMENT ON COLUMN "product"."created_at" IS '创建时间';
COMMENT ON COLUMN "product"."updated_at" IS '更新时间';
COMMENT ON TABLE "product_category" IS '商品品类表 (树状层级结构)';
COMMENT ON COLUMN "product_category"."id" IS '主键ID (UUIDv7)';
COMMENT ON COLUMN "product_category"."parent_product_category_id" IS '父级品类主键ID (根级为空)';
COMMENT ON COLUMN "product_category"."code" IS '品类编码 (全表唯一)';
COMMENT ON COLUMN "product_category"."name" IS '品类名称';
COMMENT ON COLUMN "product_category"."icon_file_asset_id" IS '图标附件ID (平台附件)';
COMMENT ON COLUMN "product_category"."sort_order" IS '排序权重';
COMMENT ON COLUMN "product_category"."status" IS '状态: ACTIVE / DISABLED';
COMMENT ON COLUMN "product_category"."created_by_id" IS '创建人用户ID (UUIDv7)';
COMMENT ON COLUMN "product_category"."dept_id" IS '归属部门ID (UUIDv7)';
COMMENT ON COLUMN "product_category"."updated_by_id" IS '最后更新人用户ID (UUIDv7)';
COMMENT ON COLUMN "product_category"."is_deleted" IS '软删除标记 (默认 false)';
COMMENT ON COLUMN "product_category"."deleted_at" IS '软删除时间';
COMMENT ON COLUMN "product_category"."deleted_by_id" IS '软删除操作人用户ID (UUIDv7)';
COMMENT ON COLUMN "product_category"."created_at" IS '创建时间';
COMMENT ON COLUMN "product_category"."updated_at" IS '更新时间';
COMMENT ON TABLE "product_default_bom" IS '商品默认 BOM 映射表';
COMMENT ON COLUMN "product_default_bom"."id" IS '主键ID (UUIDv7)';
COMMENT ON COLUMN "product_default_bom"."product_id" IS '目标商品ID (关联 Product.id)';
COMMENT ON COLUMN "product_default_bom"."bom_id" IS '指定默认 BOM 版本族ID';
COMMENT ON COLUMN "product_default_bom"."created_by_id" IS '创建人用户ID (UUIDv7)';
COMMENT ON COLUMN "product_default_bom"."dept_id" IS '归属部门ID (UUIDv7)';
COMMENT ON COLUMN "product_default_bom"."updated_by_id" IS '最后更新人用户ID (UUIDv7)';
COMMENT ON COLUMN "product_default_bom"."is_deleted" IS '软删除标记 (默认 false)';
COMMENT ON COLUMN "product_default_bom"."deleted_at" IS '软删除时间';
COMMENT ON COLUMN "product_default_bom"."deleted_by_id" IS '软删除操作人用户ID (UUIDv7)';
COMMENT ON COLUMN "product_default_bom"."created_at" IS '创建时间';
COMMENT ON COLUMN "product_default_bom"."updated_at" IS '更新时间';
COMMENT ON TABLE "production_line" IS '生产产线主档表';
COMMENT ON COLUMN "production_line"."id" IS '主键ID (UUIDv7)';
COMMENT ON COLUMN "production_line"."workshop_id" IS '所属车间ID';
COMMENT ON COLUMN "production_line"."code" IS '产线编码 (全表唯一)';
COMMENT ON COLUMN "production_line"."name" IS '产线名称';
COMMENT ON COLUMN "production_line"."minimum_batch_quantity" IS '产线通用最小生产批量默认值';
COMMENT ON COLUMN "production_line"."minimum_batch_unit_id" IS '最小批量单位ID (关联 UnitOfMeasure.id)';
COMMENT ON COLUMN "production_line"."status" IS '状态: ACTIVE / DISABLED';
COMMENT ON COLUMN "production_line"."created_by_id" IS '创建人用户ID (UUIDv7)';
COMMENT ON COLUMN "production_line"."dept_id" IS '归属部门ID (UUIDv7)';
COMMENT ON COLUMN "production_line"."updated_by_id" IS '最后更新人用户ID (UUIDv7)';
COMMENT ON COLUMN "production_line"."is_deleted" IS '软删除标记 (默认 false)';
COMMENT ON COLUMN "production_line"."deleted_at" IS '软删除时间';
COMMENT ON COLUMN "production_line"."deleted_by_id" IS '软删除操作人用户ID (UUIDv7)';
COMMENT ON COLUMN "production_line"."created_at" IS '创建时间';
COMMENT ON COLUMN "production_line"."updated_at" IS '更新时间';
COMMENT ON TABLE "production_line_operation" IS '产线可用工序关系表';
COMMENT ON COLUMN "production_line_operation"."id" IS '主键ID (UUIDv7)';
COMMENT ON COLUMN "production_line_operation"."production_line_id" IS '产线ID';
COMMENT ON COLUMN "production_line_operation"."operation_id" IS '工序ID';
COMMENT ON COLUMN "production_line_operation"."is_default" IS '是否为该工序默认产线';
COMMENT ON COLUMN "production_line_operation"."setup_minutes" IS '本产线覆盖准备时间 (分钟)';
COMMENT ON COLUMN "production_line_operation"."cleanup_minutes" IS '本产线覆盖清理时间 (分钟)';
COMMENT ON COLUMN "production_line_operation"."created_by_id" IS '创建人用户ID (UUIDv7)';
COMMENT ON COLUMN "production_line_operation"."dept_id" IS '归属部门ID (UUIDv7)';
COMMENT ON COLUMN "production_line_operation"."updated_by_id" IS '最后更新人用户ID (UUIDv7)';
COMMENT ON COLUMN "production_line_operation"."is_deleted" IS '软删除标记 (默认 false)';
COMMENT ON COLUMN "production_line_operation"."deleted_at" IS '软删除时间';
COMMENT ON COLUMN "production_line_operation"."deleted_by_id" IS '软删除操作人用户ID (UUIDv7)';
COMMENT ON COLUMN "production_line_operation"."created_at" IS '创建时间';
COMMENT ON COLUMN "production_line_operation"."updated_at" IS '更新时间';
COMMENT ON TABLE "production_line_warehouse" IS '产线仓库关系表 (进料/在制品/出产/退料仓)';
COMMENT ON COLUMN "production_line_warehouse"."id" IS '主键ID (UUIDv7)';
COMMENT ON COLUMN "production_line_warehouse"."production_line_id" IS '生产产线ID';
COMMENT ON COLUMN "production_line_warehouse"."warehouse_id" IS '仓库ID (关联 Warehouse.id)';
COMMENT ON COLUMN "production_line_warehouse"."warehouse_role" IS '仓库业务角色: INPUT(进料) / WIP(线边/在制品) / OUTPUT(成品产出) / RETURN(退料)';
COMMENT ON COLUMN "production_line_warehouse"."is_default" IS '是否为该角色的默认仓库';
COMMENT ON COLUMN "production_line_warehouse"."created_by_id" IS '创建人用户ID (UUIDv7)';
COMMENT ON COLUMN "production_line_warehouse"."dept_id" IS '归属部门ID (UUIDv7)';
COMMENT ON COLUMN "production_line_warehouse"."updated_by_id" IS '最后更新人用户ID (UUIDv7)';
COMMENT ON COLUMN "production_line_warehouse"."is_deleted" IS '软删除标记 (默认 false)';
COMMENT ON COLUMN "production_line_warehouse"."deleted_at" IS '软删除时间';
COMMENT ON COLUMN "production_line_warehouse"."deleted_by_id" IS '软删除操作人用户ID (UUIDv7)';
COMMENT ON COLUMN "production_line_warehouse"."created_at" IS '创建时间';
COMMENT ON COLUMN "production_line_warehouse"."updated_at" IS '更新时间';
COMMENT ON TABLE "product_quality_grade" IS '商品质量等级分配表';
COMMENT ON COLUMN "product_quality_grade"."id" IS '主键ID (UUIDv7)';
COMMENT ON COLUMN "product_quality_grade"."product_id" IS '关联商品ID';
COMMENT ON COLUMN "product_quality_grade"."quality_grade_dict_item_id" IS '等级字典项ID (PRODUCT_QUALITY_GRADE)';
COMMENT ON COLUMN "product_quality_grade"."is_default" IS '是否商品默认等级';
COMMENT ON COLUMN "product_quality_grade"."created_by_id" IS '创建人用户ID (UUIDv7)';
COMMENT ON COLUMN "product_quality_grade"."dept_id" IS '归属部门ID (UUIDv7)';
COMMENT ON COLUMN "product_quality_grade"."updated_by_id" IS '最后更新人用户ID (UUIDv7)';
COMMENT ON COLUMN "product_quality_grade"."is_deleted" IS '软删除标记 (默认 false)';
COMMENT ON COLUMN "product_quality_grade"."deleted_at" IS '软删除时间';
COMMENT ON COLUMN "product_quality_grade"."deleted_by_id" IS '软删除操作人用户ID (UUIDv7)';
COMMENT ON COLUMN "product_quality_grade"."created_at" IS '创建时间';
COMMENT ON COLUMN "product_quality_grade"."updated_at" IS '更新时间';
COMMENT ON TABLE "product_tag" IS '商品业务标签分配表';
COMMENT ON COLUMN "product_tag"."id" IS '主键ID (UUIDv7)';
COMMENT ON COLUMN "product_tag"."product_id" IS '关联商品ID';
COMMENT ON COLUMN "product_tag"."tag_dict_item_id" IS '标签字典项ID (PRODUCT_TAG)';
COMMENT ON COLUMN "product_tag"."created_by_id" IS '创建人用户ID (UUIDv7)';
COMMENT ON COLUMN "product_tag"."dept_id" IS '归属部门ID (UUIDv7)';
COMMENT ON COLUMN "product_tag"."updated_by_id" IS '最后更新人用户ID (UUIDv7)';
COMMENT ON COLUMN "product_tag"."is_deleted" IS '软删除标记 (默认 false)';
COMMENT ON COLUMN "product_tag"."deleted_at" IS '软删除时间';
COMMENT ON COLUMN "product_tag"."deleted_by_id" IS '软删除操作人用户ID (UUIDv7)';
COMMENT ON COLUMN "product_tag"."created_at" IS '创建时间';
COMMENT ON COLUMN "product_tag"."updated_at" IS '更新时间';
COMMENT ON TABLE "product_unit_conversion" IS '商品单位换算关系表';
COMMENT ON COLUMN "product_unit_conversion"."id" IS '主键ID (UUIDv7)';
COMMENT ON COLUMN "product_unit_conversion"."product_id" IS '目标商品ID';
COMMENT ON COLUMN "product_unit_conversion"."from_unit_id" IS '源单位ID';
COMMENT ON COLUMN "product_unit_conversion"."to_unit_id" IS '目标单位ID';
COMMENT ON COLUMN "product_unit_conversion"."conversion_factor" IS '换算倍率 (1 源单位 = conversionFactor 目标单位)';
COMMENT ON COLUMN "product_unit_conversion"."effective_from" IS '生效时间';
COMMENT ON COLUMN "product_unit_conversion"."effective_to" IS '失效时间';
COMMENT ON COLUMN "product_unit_conversion"."status" IS '状态: ACTIVE / DISABLED';
COMMENT ON COLUMN "product_unit_conversion"."created_by_id" IS '创建人用户ID (UUIDv7)';
COMMENT ON COLUMN "product_unit_conversion"."dept_id" IS '归属部门ID (UUIDv7)';
COMMENT ON COLUMN "product_unit_conversion"."updated_by_id" IS '最后更新人用户ID (UUIDv7)';
COMMENT ON COLUMN "product_unit_conversion"."is_deleted" IS '软删除标记 (默认 false)';
COMMENT ON COLUMN "product_unit_conversion"."deleted_at" IS '软删除时间';
COMMENT ON COLUMN "product_unit_conversion"."deleted_by_id" IS '软删除操作人用户ID (UUIDv7)';
COMMENT ON COLUMN "product_unit_conversion"."created_at" IS '创建时间';
COMMENT ON COLUMN "product_unit_conversion"."updated_at" IS '更新时间';
COMMENT ON TABLE "supplier" IS '供应商主档表';
COMMENT ON COLUMN "supplier"."id" IS '主键ID (UUIDv7)';
COMMENT ON COLUMN "supplier"."code" IS '供应商编码 (全表唯一)';
COMMENT ON COLUMN "supplier"."name" IS '供应商全称';
COMMENT ON COLUMN "supplier"."short_name" IS '供应商简称';
COMMENT ON COLUMN "supplier"."contact_name" IS '默认联系人姓名';
COMMENT ON COLUMN "supplier"."contact_phone" IS '默认联系人电话';
COMMENT ON COLUMN "supplier"."remark" IS '备注说明';
COMMENT ON COLUMN "supplier"."status" IS '状态: ACTIVE(正常) / DISABLED(停用)';
COMMENT ON COLUMN "supplier"."created_by_id" IS '创建人用户ID (UUIDv7)';
COMMENT ON COLUMN "supplier"."dept_id" IS '归属部门ID (UUIDv7)';
COMMENT ON COLUMN "supplier"."updated_by_id" IS '最后更新人用户ID (UUIDv7)';
COMMENT ON COLUMN "supplier"."is_deleted" IS '软删除标记 (默认 false)';
COMMENT ON COLUMN "supplier"."deleted_at" IS '软删除时间';
COMMENT ON COLUMN "supplier"."deleted_by_id" IS '软删除操作人用户ID (UUIDv7)';
COMMENT ON COLUMN "supplier"."created_at" IS '创建时间';
COMMENT ON COLUMN "supplier"."updated_at" IS '更新时间';
COMMENT ON TABLE "supplier_product" IS '供应商可供商品关系表';
COMMENT ON COLUMN "supplier_product"."id" IS '主键ID (UUIDv7)';
COMMENT ON COLUMN "supplier_product"."supplier_id" IS '供应商ID';
COMMENT ON COLUMN "supplier_product"."product_id" IS '商品ID (关联 Product.id)';
COMMENT ON COLUMN "supplier_product"."supplier_product_code" IS '供应商端商品物料编码';
COMMENT ON COLUMN "supplier_product"."purchase_unit_id" IS '采购单位ID (关联 UnitOfMeasure.id)';
COMMENT ON COLUMN "supplier_product"."minimum_order_quantity" IS '最小起订量 (按采购单位)';
COMMENT ON COLUMN "supplier_product"."lead_time_hours" IS '采购提前期 (小时)';
COMMENT ON COLUMN "supplier_product"."is_default" IS '是否该商品的默认供应商';
COMMENT ON COLUMN "supplier_product"."status" IS '状态: ACTIVE / DISABLED';
COMMENT ON COLUMN "supplier_product"."created_by_id" IS '创建人用户ID (UUIDv7)';
COMMENT ON COLUMN "supplier_product"."dept_id" IS '归属部门ID (UUIDv7)';
COMMENT ON COLUMN "supplier_product"."updated_by_id" IS '最后更新人用户ID (UUIDv7)';
COMMENT ON COLUMN "supplier_product"."is_deleted" IS '软删除标记 (默认 false)';
COMMENT ON COLUMN "supplier_product"."deleted_at" IS '软删除时间';
COMMENT ON COLUMN "supplier_product"."deleted_by_id" IS '软删除操作人用户ID (UUIDv7)';
COMMENT ON COLUMN "supplier_product"."created_at" IS '创建时间';
COMMENT ON COLUMN "supplier_product"."updated_at" IS '更新时间';
COMMENT ON COLUMN "tenant_dict_item"."created_by_id" IS '创建人用户ID (UUIDv7；系统写入为 00000000-0000-7000-8000-000000000000)';
COMMENT ON COLUMN "tenant_dict_item"."dept_id" IS '归属部门ID (UUIDv7)';
COMMENT ON COLUMN "tenant_dict_item"."updated_by_id" IS '最后更新人用户ID (UUIDv7)';
COMMENT ON COLUMN "tenant_dict_item"."is_deleted" IS '软删除标记 (默认 false)';
COMMENT ON COLUMN "tenant_dict_item"."deleted_at" IS '软删除时间';
COMMENT ON COLUMN "tenant_dict_item"."deleted_by_id" IS '软删除操作人用户ID (UUIDv7)';
COMMENT ON TABLE "unit_of_measure" IS '计量单位表';
COMMENT ON COLUMN "unit_of_measure"."id" IS '主键ID (UUIDv7)';
COMMENT ON COLUMN "unit_of_measure"."code" IS '单位编码 (如 KG, G, PCS 等，唯一)';
COMMENT ON COLUMN "unit_of_measure"."name" IS '单位显示名称 (如 千克, 克, 个 等)';
COMMENT ON COLUMN "unit_of_measure"."dimension_dict_item_id" IS '维度字典项ID (关联 tenant_dict_item.id，类型必须为 UNIT_DIMENSION)';
COMMENT ON COLUMN "unit_of_measure"."base_factor" IS '转换到本维度基准单位的倍率 (基准单位为 1.0)';
COMMENT ON COLUMN "unit_of_measure"."decimal_places" IS '默认数量小数精度 (0～6)';
COMMENT ON COLUMN "unit_of_measure"."is_system" IS '是否系统内置单位';
COMMENT ON COLUMN "unit_of_measure"."status" IS '状态: ACTIVE / DISABLED';
COMMENT ON COLUMN "unit_of_measure"."created_by_id" IS '创建人用户ID (UUIDv7)';
COMMENT ON COLUMN "unit_of_measure"."dept_id" IS '归属部门ID (UUIDv7)';
COMMENT ON COLUMN "unit_of_measure"."updated_by_id" IS '最后更新人用户ID (UUIDv7)';
COMMENT ON COLUMN "unit_of_measure"."is_deleted" IS '软删除标记 (默认 false)';
COMMENT ON COLUMN "unit_of_measure"."deleted_at" IS '软删除时间';
COMMENT ON COLUMN "unit_of_measure"."deleted_by_id" IS '软删除操作人用户ID (UUIDv7)';
COMMENT ON COLUMN "unit_of_measure"."created_at" IS '创建时间';
COMMENT ON COLUMN "unit_of_measure"."updated_at" IS '更新时间';
COMMENT ON TABLE "warehouse" IS '仓库主档表';
COMMENT ON COLUMN "warehouse"."id" IS '主键ID (UUIDv7)';
COMMENT ON COLUMN "warehouse"."code" IS '仓库编码 (全表唯一)';
COMMENT ON COLUMN "warehouse"."name" IS '仓库名称';
COMMENT ON COLUMN "warehouse"."warehouse_type_dict_item_id" IS '仓库类型字典项ID (WAREHOUSE_TYPE)';
COMMENT ON COLUMN "warehouse"."temperature_zone_dict_item_id" IS '温层分类字典项ID (TEMPERATURE_ZONE)';
COMMENT ON COLUMN "warehouse"."status" IS '状态: ACTIVE / DISABLED';
COMMENT ON COLUMN "warehouse"."created_by_id" IS '创建人用户ID (UUIDv7)';
COMMENT ON COLUMN "warehouse"."dept_id" IS '归属部门ID (UUIDv7)';
COMMENT ON COLUMN "warehouse"."updated_by_id" IS '最后更新人用户ID (UUIDv7)';
COMMENT ON COLUMN "warehouse"."is_deleted" IS '软删除标记 (默认 false)';
COMMENT ON COLUMN "warehouse"."deleted_at" IS '软删除时间';
COMMENT ON COLUMN "warehouse"."deleted_by_id" IS '软删除操作人用户ID (UUIDv7)';
COMMENT ON COLUMN "warehouse"."created_at" IS '创建时间';
COMMENT ON COLUMN "warehouse"."updated_at" IS '更新时间';
COMMENT ON TABLE "warehouse_location" IS '库位定义表';
COMMENT ON COLUMN "warehouse_location"."id" IS '主键ID (UUIDv7)';
COMMENT ON COLUMN "warehouse_location"."warehouse_id" IS '所属仓库ID';
COMMENT ON COLUMN "warehouse_location"."code" IS '仓库内库位编码';
COMMENT ON COLUMN "warehouse_location"."zone" IS '区域 (Zone)';
COMMENT ON COLUMN "warehouse_location"."shelf" IS '货架 (Shelf)';
COMMENT ON COLUMN "warehouse_location"."layer" IS '层 (Layer)';
COMMENT ON COLUMN "warehouse_location"."position" IS '位 (Position)';
COMMENT ON COLUMN "warehouse_location"."temperature_zone_dict_item_id" IS '温层字典项ID (可覆盖仓库默认温层)';
COMMENT ON COLUMN "warehouse_location"."status" IS '状态: ACTIVE / DISABLED';
COMMENT ON COLUMN "warehouse_location"."created_by_id" IS '创建人用户ID (UUIDv7)';
COMMENT ON COLUMN "warehouse_location"."dept_id" IS '归属部门ID (UUIDv7)';
COMMENT ON COLUMN "warehouse_location"."updated_by_id" IS '最后更新人用户ID (UUIDv7)';
COMMENT ON COLUMN "warehouse_location"."is_deleted" IS '软删除标记 (默认 false)';
COMMENT ON COLUMN "warehouse_location"."deleted_at" IS '软删除时间';
COMMENT ON COLUMN "warehouse_location"."deleted_by_id" IS '软删除操作人用户ID (UUIDv7)';
COMMENT ON COLUMN "warehouse_location"."created_at" IS '创建时间';
COMMENT ON COLUMN "warehouse_location"."updated_at" IS '更新时间';
COMMENT ON TABLE "workshop" IS '生产车间主档表';
COMMENT ON COLUMN "workshop"."id" IS '主键ID (UUIDv7)';
COMMENT ON COLUMN "workshop"."code" IS '车间编码 (全表唯一)';
COMMENT ON COLUMN "workshop"."name" IS '车间名称';
COMMENT ON COLUMN "workshop"."description" IS '车间说明/描述';
COMMENT ON COLUMN "workshop"."status" IS '状态: ACTIVE / DISABLED';
COMMENT ON COLUMN "workshop"."created_by_id" IS '创建人用户ID (UUIDv7)';
COMMENT ON COLUMN "workshop"."dept_id" IS '归属部门ID (UUIDv7)';
COMMENT ON COLUMN "workshop"."updated_by_id" IS '最后更新人用户ID (UUIDv7)';
COMMENT ON COLUMN "workshop"."is_deleted" IS '软删除标记 (默认 false)';
COMMENT ON COLUMN "workshop"."deleted_at" IS '软删除时间';
COMMENT ON COLUMN "workshop"."deleted_by_id" IS '软删除操作人用户ID (UUIDv7)';
COMMENT ON COLUMN "workshop"."created_at" IS '创建时间';
COMMENT ON COLUMN "workshop"."updated_at" IS '更新时间';
