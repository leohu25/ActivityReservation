-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "bom_header" (
    "id" TEXT NOT NULL,
    "bom_code" VARCHAR(50) NOT NULL,
    "bom_name" VARCHAR(100) NOT NULL,
    "bom_type" VARCHAR(20) NOT NULL,
    "version" VARCHAR(20) NOT NULL DEFAULT 'V1.0',
    "is_research" BOOLEAN NOT NULL DEFAULT false,
    "is_default" BOOLEAN NOT NULL DEFAULT true,
    "output_item_code" VARCHAR(50) NOT NULL,
    "batch_qty" DECIMAL(12,3) NOT NULL DEFAULT 1,
    "batch_unit" VARCHAR(20) NOT NULL,
    "production_line_id" VARCHAR(50),
    "route_code" VARCHAR(50),
    "override_total_yield" BOOLEAN NOT NULL DEFAULT false,
    "total_yield_rate" DECIMAL(5,2),
    "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    "effective_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remark" VARCHAR(200),
    "created_by_id" VARCHAR(50) NOT NULL,
    "dept_id" VARCHAR(50),
    "updated_by_id" VARCHAR(50),
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "deleted_by_id" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bom_header_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bom_input_item" (
    "id" TEXT NOT NULL,
    "bom_process_id" VARCHAR(50) NOT NULL,
    "item_code" VARCHAR(50) NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "uom" VARCHAR(20) NOT NULL,
    "material_role" VARCHAR(20) NOT NULL,
    "proportion" DECIMAL(5,2),
    "prev_process_seq" INTEGER,
    "child_bom_id" VARCHAR(50),

    CONSTRAINT "bom_input_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bom_mrp_override" (
    "id" TEXT NOT NULL,
    "plan_id" VARCHAR(50) NOT NULL,
    "bom_id" VARCHAR(50) NOT NULL,
    "input_item_id" VARCHAR(50) NOT NULL,
    "original_role" VARCHAR(20) NOT NULL,
    "new_role" VARCHAR(20) NOT NULL,
    "reason" VARCHAR(200),
    "created_by_id" VARCHAR(50) NOT NULL,
    "dept_id" VARCHAR(50),
    "updated_by_id" VARCHAR(50),
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "deleted_by_id" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bom_mrp_override_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bom_output_item" (
    "id" TEXT NOT NULL,
    "bom_process_id" VARCHAR(50) NOT NULL,
    "item_code" VARCHAR(50) NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "uom" VARCHAR(20) NOT NULL,
    "output_type" VARCHAR(20) NOT NULL,
    "material_role" VARCHAR(20) NOT NULL,
    "next_process_seq" INTEGER,

    CONSTRAINT "bom_output_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bom_process" (
    "id" TEXT NOT NULL,
    "bom_id" VARCHAR(50) NOT NULL,
    "seq_no" INTEGER NOT NULL,
    "process_id" VARCHAR(50) NOT NULL,
    "spec_id" VARCHAR(50),
    "loss_rate" DECIMAL(5,2) NOT NULL,
    "yield_rate" DECIMAL(5,2) NOT NULL,
    "std_labor_hours" DECIMAL(8,3),
    "qc_checkpoint" BOOLEAN NOT NULL DEFAULT false,
    "instruction_params" JSONB,
    "operating_instructions" TEXT,

    CONSTRAINT "bom_process_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_profile" (
    "id" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "short_name" TEXT,
    "credit_code" TEXT,
    "legal_person" TEXT,
    "contact_phone" TEXT,
    "contact_email" TEXT,
    "address" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Shanghai',
    "currency" TEXT NOT NULL DEFAULT 'CNY',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer" (
    "customer_code" VARCHAR(30) NOT NULL,
    "customer_name" VARCHAR(100) NOT NULL,
    "category_code" VARCHAR(20) NOT NULL,
    "contact_person" VARCHAR(50) NOT NULL,
    "contact_phone" VARCHAR(20) NOT NULL,
    "settlement_method" VARCHAR(20) NOT NULL,
    "default_tax_rate" DECIMAL(5,2),
    "credit_limit" DECIMAL(12,2),
    "customer_tags" VARCHAR(200),
    "sales_person" VARCHAR(50),
    "default_warehouse" VARCHAR(50),
    "payment_cycle" VARCHAR(20),
    "service_time" VARCHAR(50),
    "last_order_time" TIMESTAMP(3),
    "status" VARCHAR(10) NOT NULL DEFAULT 'ACTIVE',
    "created_by_id" VARCHAR(50) NOT NULL,
    "dept_id" VARCHAR(50),
    "updated_by_id" VARCHAR(50),
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "deleted_by_id" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_pkey" PRIMARY KEY ("customer_code")
);

-- CreateTable
CREATE TABLE "customer_category" (
    "category_code" VARCHAR(20) NOT NULL,
    "category_name" VARCHAR(50) NOT NULL,
    "parent_code" VARCHAR(20),
    "description" VARCHAR(200),
    "status" VARCHAR(10) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_category_pkey" PRIMARY KEY ("category_code")
);

-- CreateTable
CREATE TABLE "customer_quote" (
    "quote_id" VARCHAR(30) NOT NULL,
    "customer_code" VARCHAR(30),
    "store_code" VARCHAR(30),
    "region_code" VARCHAR(50),
    "quote_date" DATE NOT NULL,
    "effective_date" DATE NOT NULL,
    "expiry_date" DATE,
    "quote_type" VARCHAR(20) NOT NULL DEFAULT 'STANDARD',
    "display_name" VARCHAR(100),
    "item_count" INTEGER NOT NULL DEFAULT 0,
    "customer_count" INTEGER NOT NULL DEFAULT 0,
    "status" VARCHAR(10) NOT NULL DEFAULT 'DRAFT',
    "created_by" VARCHAR(50) NOT NULL,
    "created_by_id" VARCHAR(50) NOT NULL,
    "dept_id" VARCHAR(50),
    "updated_by_id" VARCHAR(50),
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "deleted_by_id" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_quote_pkey" PRIMARY KEY ("quote_id")
);

-- CreateTable
CREATE TABLE "customer_quote_item" (
    "quote_detail_id" VARCHAR(50) NOT NULL,
    "quote_id" VARCHAR(30) NOT NULL,
    "item_code" VARCHAR(50) NOT NULL,
    "item_name" VARCHAR(100) NOT NULL,
    "sales_unit" VARCHAR(20) NOT NULL,
    "unit_price_excl_tax" DECIMAL(10,2) NOT NULL,
    "unit_price_incl_tax" DECIMAL(10,2) NOT NULL,
    "tax_rate" DECIMAL(5,2) NOT NULL,
    "min_qty" DECIMAL(10,2),
    "max_qty" DECIMAL(10,2),
    "remark" VARCHAR(200),

    CONSTRAINT "customer_quote_item_pkey" PRIMARY KEY ("quote_detail_id")
);

-- CreateTable
CREATE TABLE "customer_store" (
    "store_code" VARCHAR(30) NOT NULL,
    "customer_code" VARCHAR(30) NOT NULL,
    "store_name" VARCHAR(100) NOT NULL,
    "address" VARCHAR(200) NOT NULL,
    "contact_person" VARCHAR(50) NOT NULL,
    "contact_phone" VARCHAR(20) NOT NULL,
    "delivery_period" VARCHAR(50),
    "default_route" VARCHAR(50),
    "default_driver" VARCHAR(50),
    "store_tags" VARCHAR(200),
    "region_code" VARCHAR(50) NOT NULL,
    "billing_contact" VARCHAR(50),
    "billing_phone" VARCHAR(20),
    "status" VARCHAR(10) NOT NULL DEFAULT 'ACTIVE',
    "created_by_id" VARCHAR(50) NOT NULL,
    "dept_id" VARCHAR(50),
    "updated_by_id" VARCHAR(50),
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "deleted_by_id" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_store_pkey" PRIMARY KEY ("store_code")
);

-- CreateTable
CREATE TABLE "customer_tag" (
    "tag_code" VARCHAR(20) NOT NULL,
    "tag_name" VARCHAR(50) NOT NULL,
    "tag_type" VARCHAR(20) NOT NULL,
    "description" VARCHAR(200),
    "status" VARCHAR(10) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_tag_pkey" PRIMARY KEY ("tag_code")
);

-- CreateTable
CREATE TABLE "customer_tag_assignment" (
    "customer_code" VARCHAR(30) NOT NULL,
    "tag_code" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_tag_assignment_pkey" PRIMARY KEY ("customer_code","tag_code")
);

-- CreateTable
CREATE TABLE "department" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "parent_id" TEXT,
    "leader_member_id" TEXT,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_profile" (
    "id" TEXT NOT NULL,
    "member_id" TEXT,
    "user_id" TEXT,
    "invitation_id" TEXT,
    "employee_no" TEXT,
    "department_id" TEXT,
    "position_id" TEXT,
    "manager_employee_id" TEXT,
    "name_snapshot" TEXT NOT NULL DEFAULT '',
    "email_snapshot" TEXT NOT NULL DEFAULT '',
    "job_title" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "joined_at" TIMESTAMP(3),
    "terminated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_category" (
    "id" TEXT NOT NULL,
    "category_code" VARCHAR(30) NOT NULL,
    "category_name" VARCHAR(100) NOT NULL,
    "parent_id" VARCHAR(30),
    "level" INTEGER NOT NULL DEFAULT 1,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "created_by_id" VARCHAR(50) NOT NULL,
    "dept_id" VARCHAR(50),
    "updated_by_id" VARCHAR(50),
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "deleted_by_id" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "item_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_grade" (
    "id" TEXT NOT NULL,
    "grade_code" VARCHAR(30) NOT NULL,
    "grade_name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(200),
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "created_by_id" VARCHAR(50) NOT NULL,
    "dept_id" VARCHAR(50),
    "updated_by_id" VARCHAR(50),
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "deleted_by_id" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "item_grade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_master" (
    "id" TEXT NOT NULL,
    "item_code" VARCHAR(50) NOT NULL,
    "item_name" VARCHAR(100) NOT NULL,
    "item_alias" VARCHAR(100),
    "picture_url" VARCHAR(500),
    "item_category" VARCHAR(20) NOT NULL,
    "category_id" VARCHAR(50) NOT NULL,
    "variety_id" VARCHAR(50),
    "grade_id" VARCHAR(50),
    "supply_mode" VARCHAR(20) NOT NULL,
    "item_type" VARCHAR(20) NOT NULL DEFAULT 'STANDARD',
    "item_tags" VARCHAR(200),
    "base_unit" VARCHAR(20) NOT NULL,
    "purchase_unit" VARCHAR(20) NOT NULL,
    "stock_unit" VARCHAR(20) NOT NULL,
    "production_unit" VARCHAR(20),
    "sales_unit" VARCHAR(20),
    "min_purchase_qty" DECIMAL(12,3),
    "min_sales_qty" DECIMAL(12,3),
    "max_sales_qty" DECIMAL(12,3) NOT NULL DEFAULT 99999,
    "qty_precision" INTEGER NOT NULL DEFAULT 2,
    "default_supplier_id" VARCHAR(50),
    "default_warehouse_id" VARCHAR(50),
    "default_route_code" VARCHAR(50),
    "shelf_life_hours" INTEGER,
    "batch_managed" BOOLEAN NOT NULL DEFAULT true,
    "temperature_zone" VARCHAR(20),
    "processing_form" VARCHAR(50),
    "fresh_cut_flag" BOOLEAN NOT NULL DEFAULT false,
    "acceptance_standard" TEXT,
    "reference_price" DECIMAL(10,2),
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "created_by_id" VARCHAR(50) NOT NULL,
    "dept_id" VARCHAR(50),
    "updated_by_id" VARCHAR(50),
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "deleted_by_id" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "item_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_variety" (
    "id" TEXT NOT NULL,
    "variety_code" VARCHAR(30) NOT NULL,
    "variety_name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(200),
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "created_by_id" VARCHAR(50) NOT NULL,
    "dept_id" VARCHAR(50),
    "updated_by_id" VARCHAR(50),
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "deleted_by_id" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "item_variety_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "position" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "position_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "process_master" (
    "id" TEXT NOT NULL,
    "process_code" VARCHAR(30) NOT NULL,
    "process_name" VARCHAR(100) NOT NULL,
    "category" VARCHAR(20) NOT NULL,
    "default_loss_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "min_batch_qty" DECIMAL(12,3),
    "std_labor_hours" DECIMAL(8,3),
    "description" VARCHAR(200),
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "created_by_id" VARCHAR(50) NOT NULL,
    "dept_id" VARCHAR(50),
    "updated_by_id" VARCHAR(50),
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "deleted_by_id" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "process_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "process_spec" (
    "id" TEXT NOT NULL,
    "process_id" VARCHAR(50) NOT NULL,
    "spec_code" VARCHAR(30) NOT NULL,
    "spec_name" VARCHAR(100) NOT NULL,
    "spec_params" JSONB NOT NULL,
    "default_loss_rate" DECIMAL(5,2),
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "created_by_id" VARCHAR(50) NOT NULL,
    "dept_id" VARCHAR(50),
    "updated_by_id" VARCHAR(50),
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "deleted_by_id" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "process_spec_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_line" (
    "id" TEXT NOT NULL,
    "line_code" VARCHAR(30) NOT NULL,
    "line_name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(200),
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "created_by_id" VARCHAR(50) NOT NULL,
    "dept_id" VARCHAR(50),
    "updated_by_id" VARCHAR(50),
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "deleted_by_id" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "production_line_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_order" (
    "id" TEXT NOT NULL,
    "order_no" TEXT NOT NULL,
    "supplier_name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "cost_price" DECIMAL(12,2) NOT NULL,
    "dept_id" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "updated_by_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "audit_comment" TEXT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "deleted_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_order" (
    "order_id" VARCHAR(30) NOT NULL,
    "customer_code" VARCHAR(30) NOT NULL,
    "store_code" VARCHAR(30) NOT NULL,
    "order_date" DATE NOT NULL,
    "delivery_date" DATE NOT NULL,
    "sales_person" VARCHAR(50),
    "customer_tags" VARCHAR(200),
    "department" VARCHAR(50),
    "meal_period" VARCHAR(20),
    "order_source" VARCHAR(20) NOT NULL DEFAULT 'MANUAL',
    "order_type" VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    "original_order_id" VARCHAR(30),
    "sorting_remark" VARCHAR(200),
    "route_code" VARCHAR(50),
    "driver_code" VARCHAR(50),
    "lock_status" VARCHAR(20) NOT NULL DEFAULT 'UNLOCKED',
    "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    "fulfillment_status" VARCHAR(30) NOT NULL DEFAULT 'PENDING_SUMMARY',
    "settlement_status" VARCHAR(30) NOT NULL DEFAULT 'UNRECONCILED',
    "outbound_status" VARCHAR(20) DEFAULT 'PENDING_OUTBOUND',
    "outbound_time" TIMESTAMP(3),
    "outbound_cost" DECIMAL(12,2),
    "related_outbound_id" VARCHAR(30),
    "receipt_status" VARCHAR(20) DEFAULT 'UNRECEIVED',
    "print_status" VARCHAR(20) DEFAULT 'UNPRINTED',
    "total_amount" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "remark" VARCHAR(200),
    "created_by_id" VARCHAR(50) NOT NULL,
    "dept_id" VARCHAR(50),
    "updated_by_id" VARCHAR(50),
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "deleted_by_id" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_order_pkey" PRIMARY KEY ("order_id")
);

-- CreateTable
CREATE TABLE "sales_order_fee" (
    "fee_id" VARCHAR(50) NOT NULL,
    "order_id" VARCHAR(30) NOT NULL,
    "fee_type" VARCHAR(20) NOT NULL,
    "fee_amount" DECIMAL(10,2) NOT NULL,
    "remark" VARCHAR(200),
    "audit_status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    "created_by_id" VARCHAR(50) NOT NULL,
    "audited_by_id" VARCHAR(50),
    "audited_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_order_fee_pkey" PRIMARY KEY ("fee_id")
);

-- CreateTable
CREATE TABLE "sales_order_item" (
    "order_detail_id" VARCHAR(50) NOT NULL,
    "order_id" VARCHAR(30) NOT NULL,
    "item_code" VARCHAR(50) NOT NULL,
    "item_name" VARCHAR(100) NOT NULL,
    "sales_unit" VARCHAR(20) NOT NULL,
    "order_qty" DECIMAL(12,3) NOT NULL,
    "inbound_qty" DECIMAL(12,3) NOT NULL DEFAULT 0.000,
    "signed_qty" DECIMAL(12,3),
    "fulfillment_status" VARCHAR(30) NOT NULL DEFAULT 'PENDING_PRODUCE',
    "unit_price_excl_tax" DECIMAL(10,2) NOT NULL,
    "unit_price_incl_tax" DECIMAL(10,2) NOT NULL,
    "tax_rate" DECIMAL(5,2) DEFAULT 0.00,
    "subtotal_amount" DECIMAL(12,2) NOT NULL,
    "remark" VARCHAR(200),

    CONSTRAINT "sales_order_item_pkey" PRIMARY KEY ("order_detail_id")
);

-- CreateTable
CREATE TABLE "tenant_menu_item" (
    "id" TEXT NOT NULL,
    "parent_id" TEXT,
    "item_type" TEXT NOT NULL DEFAULT 'PAGE',
    "page_key" TEXT,
    "external_url" TEXT,
    "open_in_new_tab" BOOLEAN NOT NULL DEFAULT false,
    "custom_label" TEXT,
    "custom_icon" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "created_by_id" TEXT NOT NULL DEFAULT 'system',
    "dept_id" TEXT,
    "updated_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "deleted_by_id" TEXT,

    CONSTRAINT "tenant_menu_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unit_conversion" (
    "id" TEXT NOT NULL,
    "item_code" VARCHAR(50),
    "from_unit_id" VARCHAR(50) NOT NULL,
    "to_unit_id" VARCHAR(50) NOT NULL,
    "conversion_rate" DECIMAL(12,4) NOT NULL,
    "created_by_id" VARCHAR(50) NOT NULL,
    "dept_id" VARCHAR(50),
    "updated_by_id" VARCHAR(50),
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "deleted_by_id" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "unit_conversion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unit_of_measure" (
    "id" TEXT NOT NULL,
    "unit_code" VARCHAR(30) NOT NULL,
    "unit_name" VARCHAR(50) NOT NULL,
    "unit_type" VARCHAR(20) NOT NULL,
    "base_ratio" DECIMAL(12,4) NOT NULL,
    "is_base_unit" BOOLEAN NOT NULL DEFAULT false,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "created_by_id" VARCHAR(50) NOT NULL,
    "dept_id" VARCHAR(50),
    "updated_by_id" VARCHAR(50),
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "deleted_by_id" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "unit_of_measure_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bom_header_bom_code_key" ON "bom_header"("bom_code");

-- CreateIndex
CREATE INDEX "bom_header_output_item_code_bom_type_status_idx" ON "bom_header"("output_item_code", "bom_type", "status");

-- CreateIndex
CREATE INDEX "bom_header_created_by_id_idx" ON "bom_header"("created_by_id");

-- CreateIndex
CREATE INDEX "bom_header_is_deleted_idx" ON "bom_header"("is_deleted");

-- CreateIndex
CREATE INDEX "bom_input_item_bom_process_id_idx" ON "bom_input_item"("bom_process_id");

-- CreateIndex
CREATE INDEX "bom_mrp_override_plan_id_bom_id_idx" ON "bom_mrp_override"("plan_id", "bom_id");

-- CreateIndex
CREATE INDEX "bom_mrp_override_created_by_id_idx" ON "bom_mrp_override"("created_by_id");

-- CreateIndex
CREATE INDEX "bom_mrp_override_is_deleted_idx" ON "bom_mrp_override"("is_deleted");

-- CreateIndex
CREATE INDEX "bom_output_item_bom_process_id_idx" ON "bom_output_item"("bom_process_id");

-- CreateIndex
CREATE INDEX "bom_process_bom_id_seq_no_idx" ON "bom_process"("bom_id", "seq_no");

-- CreateIndex
CREATE INDEX "customer_category_code_idx" ON "customer"("category_code");

-- CreateIndex
CREATE INDEX "customer_status_idx" ON "customer"("status");

-- CreateIndex
CREATE INDEX "customer_quote_customer_code_idx" ON "customer_quote"("customer_code");

-- CreateIndex
CREATE INDEX "customer_quote_store_code_idx" ON "customer_quote"("store_code");

-- CreateIndex
CREATE INDEX "customer_quote_region_code_idx" ON "customer_quote"("region_code");

-- CreateIndex
CREATE INDEX "customer_quote_status_idx" ON "customer_quote"("status");

-- CreateIndex
CREATE INDEX "customer_quote_item_quote_id_idx" ON "customer_quote_item"("quote_id");

-- CreateIndex
CREATE INDEX "customer_quote_item_item_code_idx" ON "customer_quote_item"("item_code");

-- CreateIndex
CREATE INDEX "customer_store_customer_code_idx" ON "customer_store"("customer_code");

-- CreateIndex
CREATE INDEX "customer_store_region_code_idx" ON "customer_store"("region_code");

-- CreateIndex
CREATE INDEX "customer_store_status_idx" ON "customer_store"("status");

-- CreateIndex
CREATE UNIQUE INDEX "department_code_key" ON "department"("code");

-- CreateIndex
CREATE INDEX "department_parent_id_idx" ON "department"("parent_id");

-- CreateIndex
CREATE INDEX "department_status_idx" ON "department"("status");

-- CreateIndex
CREATE UNIQUE INDEX "employee_profile_member_id_key" ON "employee_profile"("member_id");

-- CreateIndex
CREATE UNIQUE INDEX "employee_profile_employee_no_key" ON "employee_profile"("employee_no");

-- CreateIndex
CREATE INDEX "employee_profile_department_id_idx" ON "employee_profile"("department_id");

-- CreateIndex
CREATE INDEX "employee_profile_position_id_idx" ON "employee_profile"("position_id");

-- CreateIndex
CREATE INDEX "employee_profile_manager_employee_id_idx" ON "employee_profile"("manager_employee_id");

-- CreateIndex
CREATE INDEX "employee_profile_member_id_idx" ON "employee_profile"("member_id");

-- CreateIndex
CREATE INDEX "employee_profile_status_idx" ON "employee_profile"("status");

-- CreateIndex
CREATE UNIQUE INDEX "item_category_category_code_key" ON "item_category"("category_code");

-- CreateIndex
CREATE INDEX "item_category_parent_id_idx" ON "item_category"("parent_id");

-- CreateIndex
CREATE INDEX "item_category_created_by_id_idx" ON "item_category"("created_by_id");

-- CreateIndex
CREATE INDEX "item_category_is_deleted_idx" ON "item_category"("is_deleted");

-- CreateIndex
CREATE UNIQUE INDEX "item_grade_grade_code_key" ON "item_grade"("grade_code");

-- CreateIndex
CREATE INDEX "item_grade_created_by_id_idx" ON "item_grade"("created_by_id");

-- CreateIndex
CREATE INDEX "item_grade_is_deleted_idx" ON "item_grade"("is_deleted");

-- CreateIndex
CREATE UNIQUE INDEX "item_master_item_code_key" ON "item_master"("item_code");

-- CreateIndex
CREATE INDEX "item_master_item_category_status_idx" ON "item_master"("item_category", "status");

-- CreateIndex
CREATE INDEX "item_master_created_by_id_idx" ON "item_master"("created_by_id");

-- CreateIndex
CREATE INDEX "item_master_is_deleted_idx" ON "item_master"("is_deleted");

-- CreateIndex
CREATE UNIQUE INDEX "item_variety_variety_code_key" ON "item_variety"("variety_code");

-- CreateIndex
CREATE INDEX "item_variety_created_by_id_idx" ON "item_variety"("created_by_id");

-- CreateIndex
CREATE INDEX "item_variety_is_deleted_idx" ON "item_variety"("is_deleted");

-- CreateIndex
CREATE UNIQUE INDEX "position_code_key" ON "position"("code");

-- CreateIndex
CREATE INDEX "position_status_idx" ON "position"("status");

-- CreateIndex
CREATE UNIQUE INDEX "process_master_process_code_key" ON "process_master"("process_code");

-- CreateIndex
CREATE INDEX "process_master_created_by_id_idx" ON "process_master"("created_by_id");

-- CreateIndex
CREATE INDEX "process_master_is_deleted_idx" ON "process_master"("is_deleted");

-- CreateIndex
CREATE INDEX "process_spec_created_by_id_idx" ON "process_spec"("created_by_id");

-- CreateIndex
CREATE INDEX "process_spec_is_deleted_idx" ON "process_spec"("is_deleted");

-- CreateIndex
CREATE UNIQUE INDEX "process_spec_process_id_spec_code_key" ON "process_spec"("process_id", "spec_code");

-- CreateIndex
CREATE UNIQUE INDEX "production_line_line_code_key" ON "production_line"("line_code");

-- CreateIndex
CREATE INDEX "production_line_created_by_id_idx" ON "production_line"("created_by_id");

-- CreateIndex
CREATE INDEX "production_line_is_deleted_idx" ON "production_line"("is_deleted");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_order_order_no_key" ON "purchase_order"("order_no");

-- CreateIndex
CREATE INDEX "purchase_order_dept_id_idx" ON "purchase_order"("dept_id");

-- CreateIndex
CREATE INDEX "purchase_order_created_by_id_idx" ON "purchase_order"("created_by_id");

-- CreateIndex
CREATE INDEX "purchase_order_is_deleted_idx" ON "purchase_order"("is_deleted");

-- CreateIndex
CREATE INDEX "purchase_order_status_idx" ON "purchase_order"("status");

-- CreateIndex
CREATE INDEX "sales_order_customer_code_idx" ON "sales_order"("customer_code");

-- CreateIndex
CREATE INDEX "sales_order_store_code_idx" ON "sales_order"("store_code");

-- CreateIndex
CREATE INDEX "sales_order_order_date_idx" ON "sales_order"("order_date");

-- CreateIndex
CREATE INDEX "sales_order_delivery_date_idx" ON "sales_order"("delivery_date");

-- CreateIndex
CREATE INDEX "sales_order_status_idx" ON "sales_order"("status");

-- CreateIndex
CREATE INDEX "sales_order_fulfillment_status_idx" ON "sales_order"("fulfillment_status");

-- CreateIndex
CREATE INDEX "sales_order_settlement_status_idx" ON "sales_order"("settlement_status");

-- CreateIndex
CREATE INDEX "sales_order_dept_id_idx" ON "sales_order"("dept_id");

-- CreateIndex
CREATE INDEX "sales_order_created_by_id_idx" ON "sales_order"("created_by_id");

-- CreateIndex
CREATE INDEX "sales_order_is_deleted_idx" ON "sales_order"("is_deleted");

-- CreateIndex
CREATE INDEX "sales_order_fee_order_id_idx" ON "sales_order_fee"("order_id");

-- CreateIndex
CREATE INDEX "sales_order_fee_audit_status_idx" ON "sales_order_fee"("audit_status");

-- CreateIndex
CREATE INDEX "sales_order_item_order_id_idx" ON "sales_order_item"("order_id");

-- CreateIndex
CREATE INDEX "sales_order_item_item_code_idx" ON "sales_order_item"("item_code");

-- CreateIndex
CREATE INDEX "tenant_menu_item_parent_id_sort_order_idx" ON "tenant_menu_item"("parent_id", "sort_order");

-- CreateIndex
CREATE INDEX "tenant_menu_item_is_deleted_idx" ON "tenant_menu_item"("is_deleted");

-- CreateIndex
CREATE INDEX "unit_conversion_created_by_id_idx" ON "unit_conversion"("created_by_id");

-- CreateIndex
CREATE INDEX "unit_conversion_is_deleted_idx" ON "unit_conversion"("is_deleted");

-- CreateIndex
CREATE UNIQUE INDEX "unit_conversion_item_code_from_unit_id_to_unit_id_key" ON "unit_conversion"("item_code", "from_unit_id", "to_unit_id");

-- CreateIndex
CREATE UNIQUE INDEX "unit_of_measure_unit_code_key" ON "unit_of_measure"("unit_code");

-- CreateIndex
CREATE INDEX "unit_of_measure_created_by_id_idx" ON "unit_of_measure"("created_by_id");

-- CreateIndex
CREATE INDEX "unit_of_measure_is_deleted_idx" ON "unit_of_measure"("is_deleted");

-- Database Comments
COMMENT ON TABLE "bom_header" IS '工艺 BOM 表头';
COMMENT ON COLUMN "bom_header"."id" IS 'BOM主键ID';
COMMENT ON COLUMN "bom_header"."bom_code" IS 'BOM唯一编号';
COMMENT ON COLUMN "bom_header"."bom_name" IS 'BOM名称';
COMMENT ON COLUMN "bom_header"."bom_type" IS 'BOM类型: SINGLE(单品) / COMPOSITE(组合) / PACKAGING(包装)';
COMMENT ON COLUMN "bom_header"."version" IS '版本号（如 V1.0, V1.1）';
COMMENT ON COLUMN "bom_header"."is_research" IS '是否研发BOM';
COMMENT ON COLUMN "bom_header"."is_default" IS '是否产出商品的默认生效BOM';
COMMENT ON COLUMN "bom_header"."output_item_code" IS '产出目标物料编码';
COMMENT ON COLUMN "bom_header"."batch_qty" IS '基准批量数量';
COMMENT ON COLUMN "bom_header"."batch_unit" IS '基准批量单位';
COMMENT ON COLUMN "bom_header"."production_line_id" IS '绑定的车间产线ID';
COMMENT ON COLUMN "bom_header"."route_code" IS '关联默认工艺路线编码';
COMMENT ON COLUMN "bom_header"."override_total_yield" IS '是否强行覆盖为总出成率';
COMMENT ON COLUMN "bom_header"."total_yield_rate" IS '设定的总出成率(%)';
COMMENT ON COLUMN "bom_header"."status" IS '状态: DRAFT(草稿) / UNDER_REVIEW(评审中) / ACTIVE(已发布生效) / ARCHIVED(已归档)';
COMMENT ON COLUMN "bom_header"."effective_date" IS '生效日期';
COMMENT ON COLUMN "bom_header"."remark" IS '备注信息';
COMMENT ON COLUMN "bom_header"."created_by_id" IS '创建人用户ID';
COMMENT ON COLUMN "bom_header"."dept_id" IS '归属部门ID';
COMMENT ON COLUMN "bom_header"."updated_by_id" IS '最后更新人用户ID';
COMMENT ON COLUMN "bom_header"."is_deleted" IS '软删除标记';
COMMENT ON COLUMN "bom_header"."deleted_at" IS '软删除时间';
COMMENT ON COLUMN "bom_header"."deleted_by_id" IS '软删除操作人用户ID';
COMMENT ON COLUMN "bom_header"."created_at" IS '创建时间';
COMMENT ON COLUMN "bom_header"."updated_at" IS '更新时间';
COMMENT ON TABLE "bom_input_item" IS 'BOM 投入物料明细（工序级联）';
COMMENT ON COLUMN "bom_input_item"."id" IS '投入明细ID';
COMMENT ON COLUMN "bom_input_item"."bom_process_id" IS '所属工序明细ID';
COMMENT ON COLUMN "bom_input_item"."item_code" IS '投入物料编码';
COMMENT ON COLUMN "bom_input_item"."quantity" IS '投入基准数量';
COMMENT ON COLUMN "bom_input_item"."uom" IS '投入单位';
COMMENT ON COLUMN "bom_input_item"."material_role" IS '物料角色: FLOW(流转品) / SUB_BOM(外部子件-递归展开) / PURCHASE(外购件-直接采购)';
COMMENT ON COLUMN "bom_input_item"."proportion" IS '投入占比(%)，组合BOM专用';
COMMENT ON COLUMN "bom_input_item"."prev_process_seq" IS '来源前序工序seq_no（流转品专用）';
COMMENT ON COLUMN "bom_input_item"."child_bom_id" IS '外部子件挂载的子BOM编号';
COMMENT ON TABLE "bom_mrp_override" IS 'MRP 运行时排产策略临时覆盖';
COMMENT ON COLUMN "bom_mrp_override"."id" IS '覆盖记录主键ID';
COMMENT ON COLUMN "bom_mrp_override"."plan_id" IS 'MRP排产计划编号';
COMMENT ON COLUMN "bom_mrp_override"."bom_id" IS '原BOM编号';
COMMENT ON COLUMN "bom_mrp_override"."input_item_id" IS '覆盖的投入行ID';
COMMENT ON COLUMN "bom_mrp_override"."original_role" IS '原策略（如 SUB_BOM）';
COMMENT ON COLUMN "bom_mrp_override"."new_role" IS '临时新策略（如 PURCHASE）';
COMMENT ON COLUMN "bom_mrp_override"."reason" IS '修改原因说明';
COMMENT ON COLUMN "bom_mrp_override"."created_by_id" IS '创建人用户ID';
COMMENT ON COLUMN "bom_mrp_override"."dept_id" IS '归属部门ID';
COMMENT ON COLUMN "bom_mrp_override"."updated_by_id" IS '最后更新人用户ID';
COMMENT ON COLUMN "bom_mrp_override"."is_deleted" IS '软删除标记';
COMMENT ON COLUMN "bom_mrp_override"."deleted_at" IS '软删除时间';
COMMENT ON COLUMN "bom_mrp_override"."deleted_by_id" IS '软删除操作人用户ID';
COMMENT ON COLUMN "bom_mrp_override"."created_at" IS '创建时间';
COMMENT ON COLUMN "bom_mrp_override"."updated_at" IS '更新时间';
COMMENT ON TABLE "bom_output_item" IS 'BOM 产出物料明细（工序级联）';
COMMENT ON COLUMN "bom_output_item"."id" IS '产出明细ID';
COMMENT ON COLUMN "bom_output_item"."bom_process_id" IS '所属工序明细ID';
COMMENT ON COLUMN "bom_output_item"."item_code" IS '产出物料编码';
COMMENT ON COLUMN "bom_output_item"."quantity" IS '产出数量';
COMMENT ON COLUMN "bom_output_item"."uom" IS '产出单位';
COMMENT ON COLUMN "bom_output_item"."output_type" IS '产出类型: MAIN(主产出) / BYPRODUCT(副产出/边角料) / SCRAP(废料)';
COMMENT ON COLUMN "bom_output_item"."material_role" IS '物料角色: FLOW(流转品) / FINAL(最终交付品)';
COMMENT ON COLUMN "bom_output_item"."next_process_seq" IS '下游流转工序seq_no（留空代表最终品）';
COMMENT ON TABLE "bom_process" IS 'BOM 工序节点明细（主表级联）';
COMMENT ON COLUMN "bom_process"."id" IS '工序明细ID';
COMMENT ON COLUMN "bom_process"."bom_id" IS '所属BOM ID';
COMMENT ON COLUMN "bom_process"."seq_no" IS '工序顺序号 (10, 20, 30...)';
COMMENT ON COLUMN "bom_process"."process_id" IS '关联工序ID';
COMMENT ON COLUMN "bom_process"."spec_id" IS '关联加工规格ID';
COMMENT ON COLUMN "bom_process"."loss_rate" IS '本工序损耗率(%)';
COMMENT ON COLUMN "bom_process"."yield_rate" IS '本工序出成率(%) = 100 - lossRate';
COMMENT ON COLUMN "bom_process"."std_labor_hours" IS '标准工时(小时)';
COMMENT ON COLUMN "bom_process"."qc_checkpoint" IS '是否质检节点';
COMMENT ON COLUMN "bom_process"."instruction_params" IS '工序运行指导参数快照JSON';
COMMENT ON COLUMN "bom_process"."operating_instructions" IS '工序操作图文说明';
COMMENT ON TABLE "company_profile" IS '租户企业扩展资料模型 (与平台 Organization 动静分离)';
COMMENT ON COLUMN "company_profile"."id" IS '企业扩展资料主键ID';
COMMENT ON COLUMN "company_profile"."company_name" IS '企业主体注册全称';
COMMENT ON COLUMN "company_profile"."short_name" IS '企业简称/品牌名';
COMMENT ON COLUMN "company_profile"."credit_code" IS '统一社会信用代码';
COMMENT ON COLUMN "company_profile"."legal_person" IS '法定代表人姓名';
COMMENT ON COLUMN "company_profile"."contact_phone" IS '官方业务联系电话';
COMMENT ON COLUMN "company_profile"."contact_email" IS '官方业务联系邮箱';
COMMENT ON COLUMN "company_profile"."address" IS '经营办公/注册地址';
COMMENT ON COLUMN "company_profile"."timezone" IS '业务时区 (默认 Asia/Shanghai)';
COMMENT ON COLUMN "company_profile"."currency" IS '结算本位币种 (默认 CNY)';
COMMENT ON COLUMN "company_profile"."created_at" IS '记录创建时间';
COMMENT ON COLUMN "company_profile"."updated_at" IS '记录更新时间';
COMMENT ON TABLE "customer_category" IS '客户分类表：支持多级层级树结构（如餐饮连锁、企事业单位、生鲜超市）';
COMMENT ON COLUMN "customer_category"."category_code" IS '分类编码（唯一主键标识，如 CUST_CAT_001）';
COMMENT ON COLUMN "customer_category"."category_name" IS '分类名称（如：机关食堂、品牌连锁）';
COMMENT ON COLUMN "customer_category"."parent_code" IS '父级分类编码（支持多级分类树，根级为空）';
COMMENT ON COLUMN "customer_category"."description" IS '分类业务描述';
COMMENT ON COLUMN "customer_category"."status" IS '状态：ACTIVE(启用) / DISABLED(停用)';
COMMENT ON COLUMN "customer_category"."created_at" IS '创建时间';
COMMENT ON COLUMN "customer_category"."updated_at" IS '更新时间';
COMMENT ON TABLE "customer_quote" IS '门店报价单主表：按客户+门店+区域维护的商品定价单头';
COMMENT ON COLUMN "customer_quote"."quote_id" IS '报价单唯一单号（系统自动生成，格式 QUOT-YYYYMMDD-XXXX）';
COMMENT ON COLUMN "customer_quote"."customer_code" IS '适用客户编码（与 storeCode、regionCode 构成维度优先级）';
COMMENT ON COLUMN "customer_quote"."store_code" IS '适用门店编码（为空则适用于该客户下属所有门店）';
COMMENT ON COLUMN "customer_quote"."region_code" IS '适用区域编码（客户与门店均为空时，作为该区域通用报价单）';
COMMENT ON COLUMN "customer_quote"."quote_date" IS '报价单拟定日期';
COMMENT ON COLUMN "customer_quote"."effective_date" IS '价格生效日期';
COMMENT ON COLUMN "customer_quote"."expiry_date" IS '价格失效日期（为空表示长期有效）';
COMMENT ON COLUMN "customer_quote"."quote_type" IS '报价单类型：STANDARD(普通报价单) / CYCLE(周期报价单)';
COMMENT ON COLUMN "customer_quote"."display_name" IS '对外展示简称（供客户查看核对的报价单名称）';
COMMENT ON COLUMN "customer_quote"."item_count" IS '包含的商品明细条目总数（系统自动汇总）';
COMMENT ON COLUMN "customer_quote"."customer_count" IS '关联客户总数（只读统计）';
COMMENT ON COLUMN "customer_quote"."status" IS '单据状态：DRAFT(草稿) / ACTIVE(已生效) / EXPIRED(已过期) / VOIDED(已作废)';
COMMENT ON COLUMN "customer_quote"."created_by" IS '创建人姓名或工号';
COMMENT ON COLUMN "customer_quote"."created_by_id" IS '创建人用户ID';
COMMENT ON COLUMN "customer_quote"."dept_id" IS '归属部门ID';
COMMENT ON COLUMN "customer_quote"."updated_by_id" IS '最后更新人用户ID';
COMMENT ON COLUMN "customer_quote"."is_deleted" IS '软删除标记';
COMMENT ON COLUMN "customer_quote"."deleted_at" IS '软删除时间';
COMMENT ON COLUMN "customer_quote"."deleted_by_id" IS '软删除操作人用户ID';
COMMENT ON COLUMN "customer_quote"."created_at" IS '创建时间';
COMMENT ON COLUMN "customer_quote"."updated_at" IS '更新时间';
COMMENT ON TABLE "customer_quote_item" IS '门店报价单明细表：具体商品的含税与不含税单价及起订限制';
COMMENT ON COLUMN "customer_quote_item"."quote_detail_id" IS '报价明细行主键唯一标识';
COMMENT ON COLUMN "customer_quote_item"."quote_id" IS '所属报价单单号';
COMMENT ON COLUMN "customer_quote_item"."item_code" IS '商品档案唯一编码（关联物料商品中心）';
COMMENT ON COLUMN "customer_quote_item"."item_name" IS '商品名称（如：特级上海青(净菜)）';
COMMENT ON COLUMN "customer_quote_item"."sales_unit" IS '销售计量单位（如：kg、箱、袋）';
COMMENT ON COLUMN "customer_quote_item"."unit_price_excl_tax" IS '不含税单价（元）';
COMMENT ON COLUMN "customer_quote_item"."unit_price_incl_tax" IS '含税销售单价（元）';
COMMENT ON COLUMN "customer_quote_item"."tax_rate" IS '适用增值税税率(%)，如 9.00';
COMMENT ON COLUMN "customer_quote_item"."min_qty" IS '最小起订量限制';
COMMENT ON COLUMN "customer_quote_item"."max_qty" IS '最大限购量限制';
COMMENT ON COLUMN "customer_quote_item"."remark" IS '明细备注说明';
COMMENT ON TABLE "customer_tag" IS '客户标签字典表：用于筛选、统计、报价与配送策略';
COMMENT ON COLUMN "customer_tag"."tag_code" IS '标签编码（如 TAG_DELIVERY_MORNING）';
COMMENT ON COLUMN "customer_tag"."tag_name" IS '标签名称（如：早间配送、VIP客户、学校食堂）';
COMMENT ON COLUMN "customer_tag"."tag_type" IS '标签类型：DELIVERY(配送) / SETTLEMENT(结算) / CREDIT(信用) / OTHER(其他)';
COMMENT ON COLUMN "customer_tag"."description" IS '标签业务说明';
COMMENT ON COLUMN "customer_tag"."status" IS '状态：ACTIVE(启用) / DISABLED(停用)';
COMMENT ON COLUMN "customer_tag"."created_at" IS '创建时间';
COMMENT ON COLUMN "customer_tag"."updated_at" IS '更新时间';
COMMENT ON TABLE "customer_tag_assignment" IS '客户与标签多对多关联表';
COMMENT ON COLUMN "customer_tag_assignment"."customer_code" IS '客户编码';
COMMENT ON COLUMN "customer_tag_assignment"."tag_code" IS '标签编码';
COMMENT ON COLUMN "customer_tag_assignment"."created_at" IS '关联打标时间';
COMMENT ON TABLE "employee_profile" IS '租户内员工档案模型 (对应 Control DB Member.id，组织人事与数据范围事实源)';
COMMENT ON COLUMN "employee_profile"."id" IS '员工档案主键ID';
COMMENT ON COLUMN "employee_profile"."member_id" IS '关联平台租户成员主键 (Control DB Member.id)';
COMMENT ON COLUMN "employee_profile"."user_id" IS '关联平台用户账号ID (Control DB User.id)';
COMMENT ON COLUMN "employee_profile"."invitation_id" IS '邀请记录ID (关联邀请审核流)';
COMMENT ON COLUMN "employee_profile"."employee_no" IS '员工工号 (企业内部唯一)';
COMMENT ON COLUMN "employee_profile"."department_id" IS '所属部门主键ID';
COMMENT ON COLUMN "employee_profile"."position_id" IS '所属岗位主键ID';
COMMENT ON COLUMN "employee_profile"."manager_employee_id" IS '直属上级经理档案ID';
COMMENT ON COLUMN "employee_profile"."name_snapshot" IS '员工姓名快照 (冗余展示与防变更穿透)';
COMMENT ON COLUMN "employee_profile"."email_snapshot" IS '员工工作邮箱快照';
COMMENT ON COLUMN "employee_profile"."job_title" IS '职务头衔/对外称谓';
COMMENT ON COLUMN "employee_profile"."status" IS '员工在职状态: ACTIVE(在职) / TERMINATED(离职) / SUSPENDED(停职)';
COMMENT ON COLUMN "employee_profile"."joined_at" IS '入职报到时间';
COMMENT ON COLUMN "employee_profile"."terminated_at" IS '离职归档时间';
COMMENT ON COLUMN "employee_profile"."created_at" IS '档案创建时间';
COMMENT ON COLUMN "employee_profile"."updated_at" IS '档案最后更新时间';
COMMENT ON TABLE "item_category" IS '商品分类树（支持一级品类、二级品类及多级扩展）';
COMMENT ON COLUMN "item_category"."id" IS '分类主键ID';
COMMENT ON COLUMN "item_category"."category_code" IS '分类业务编码（全局唯一）';
COMMENT ON COLUMN "item_category"."category_name" IS '分类名称';
COMMENT ON COLUMN "item_category"."parent_id" IS '父级分类ID（为空代表一级根品类）';
COMMENT ON COLUMN "item_category"."level" IS '分类层级（1: 一级, 2: 二级, 3: 三级）';
COMMENT ON COLUMN "item_category"."sort_order" IS '排序权重';
COMMENT ON COLUMN "item_category"."status" IS '状态: ACTIVE(启用) / DISABLED(停用)';
COMMENT ON COLUMN "item_category"."created_by_id" IS '创建人用户ID';
COMMENT ON COLUMN "item_category"."dept_id" IS '归属部门ID';
COMMENT ON COLUMN "item_category"."updated_by_id" IS '最后更新人用户ID';
COMMENT ON COLUMN "item_category"."is_deleted" IS '软删除标记';
COMMENT ON COLUMN "item_category"."deleted_at" IS '软删除时间';
COMMENT ON COLUMN "item_category"."deleted_by_id" IS '软删除操作人用户ID';
COMMENT ON COLUMN "item_category"."created_at" IS '创建时间';
COMMENT ON COLUMN "item_category"."updated_at" IS '更新时间';
COMMENT ON TABLE "item_grade" IS '品种等级字典（如一级品、精选级、特选级）';
COMMENT ON COLUMN "item_grade"."id" IS '等级主键ID';
COMMENT ON COLUMN "item_grade"."grade_code" IS '等级编码';
COMMENT ON COLUMN "item_grade"."grade_name" IS '等级名称';
COMMENT ON COLUMN "item_grade"."description" IS '等级描述';
COMMENT ON COLUMN "item_grade"."status" IS '状态: ACTIVE(启用) / DISABLED(停用)';
COMMENT ON COLUMN "item_grade"."created_by_id" IS '创建人用户ID';
COMMENT ON COLUMN "item_grade"."dept_id" IS '归属部门ID';
COMMENT ON COLUMN "item_grade"."updated_by_id" IS '最后更新人用户ID';
COMMENT ON COLUMN "item_grade"."is_deleted" IS '软删除标记';
COMMENT ON COLUMN "item_grade"."deleted_at" IS '软删除时间';
COMMENT ON COLUMN "item_grade"."deleted_by_id" IS '软删除操作人用户ID';
COMMENT ON COLUMN "item_grade"."created_at" IS '创建时间';
COMMENT ON COLUMN "item_grade"."updated_at" IS '更新时间';
COMMENT ON TABLE "item_master" IS '商品档案主数据（物料主数据）';
COMMENT ON COLUMN "item_master"."id" IS '物料主键ID';
COMMENT ON COLUMN "item_master"."item_code" IS '物料编码（全局唯一）';
COMMENT ON COLUMN "item_master"."item_name" IS '物料名称';
COMMENT ON COLUMN "item_master"."item_alias" IS '商品别名（搜索匹配助记词）';
COMMENT ON COLUMN "item_master"."picture_url" IS '商品主图URL';
COMMENT ON COLUMN "item_master"."item_category" IS '大类: RAW(原料) / SEMI_FINISHED(半成品) / FINISHED(成品) / PACKAGING(包材)';
COMMENT ON COLUMN "item_master"."category_id" IS '所属商品分类ID';
COMMENT ON COLUMN "item_master"."variety_id" IS '关联独立品种ID';
COMMENT ON COLUMN "item_master"."grade_id" IS '关联品种等级ID';
COMMENT ON COLUMN "item_master"."supply_mode" IS '供应方式: PURCHASE(外购) / MANUFACTURE(自制) / HYBRID(自制为主可外购)';
COMMENT ON COLUMN "item_master"."item_type" IS '商品类型: STANDARD(普通) / COMPOSITE(组合) / PACKAGE(套包)';
COMMENT ON COLUMN "item_master"."item_tags" IS '商品标签（逗号分隔）';
COMMENT ON COLUMN "item_master"."base_unit" IS '基本单位（库存核算基准单位）';
COMMENT ON COLUMN "item_master"."purchase_unit" IS '默认采购单位';
COMMENT ON COLUMN "item_master"."stock_unit" IS '默认库存单位';
COMMENT ON COLUMN "item_master"."production_unit" IS '默认生产单位';
COMMENT ON COLUMN "item_master"."sales_unit" IS '默认销售单位';
COMMENT ON COLUMN "item_master"."min_purchase_qty" IS '最小采购数量';
COMMENT ON COLUMN "item_master"."min_sales_qty" IS '最小销售数量';
COMMENT ON COLUMN "item_master"."max_sales_qty" IS '单次最大销售数量';
COMMENT ON COLUMN "item_master"."qty_precision" IS '销售与报工数量小数精度';
COMMENT ON COLUMN "item_master"."default_supplier_id" IS '默认供应商ID';
COMMENT ON COLUMN "item_master"."default_warehouse_id" IS '默认仓库ID';
COMMENT ON COLUMN "item_master"."default_route_code" IS '默认工艺路线编码';
COMMENT ON COLUMN "item_master"."shelf_life_hours" IS '保质期(小时)';
COMMENT ON COLUMN "item_master"."batch_managed" IS '是否批次管理';
COMMENT ON COLUMN "item_master"."temperature_zone" IS '储运温度带: NORMAL(常温) / COLD(冷藏) / FROZEN(冷冻)';
COMMENT ON COLUMN "item_master"."processing_form" IS '加工形态（整棵/丁/丝/片/段）';
COMMENT ON COLUMN "item_master"."fresh_cut_flag" IS '是否净菜加工品';
COMMENT ON COLUMN "item_master"."acceptance_standard" IS '验收与质检标准说明';
COMMENT ON COLUMN "item_master"."reference_price" IS '参考行情价';
COMMENT ON COLUMN "item_master"."status" IS '状态: ACTIVE(启用) / DISCONTINUED(停售) / OBSOLETE(淘汰)';
COMMENT ON COLUMN "item_master"."created_by_id" IS '创建人用户ID';
COMMENT ON COLUMN "item_master"."dept_id" IS '归属部门ID';
COMMENT ON COLUMN "item_master"."updated_by_id" IS '最后更新人用户ID';
COMMENT ON COLUMN "item_master"."is_deleted" IS '软删除标记';
COMMENT ON COLUMN "item_master"."deleted_at" IS '软删除时间';
COMMENT ON COLUMN "item_master"."deleted_by_id" IS '软删除操作人用户ID';
COMMENT ON COLUMN "item_master"."created_at" IS '创建时间';
COMMENT ON COLUMN "item_master"."updated_at" IS '更新时间';
COMMENT ON TABLE "item_variety" IS '独立品种档案（农产品原始生物品种属性，如土豆、青椒、精选五花肉）';
COMMENT ON COLUMN "item_variety"."id" IS '品种主键ID';
COMMENT ON COLUMN "item_variety"."variety_code" IS '品种编码';
COMMENT ON COLUMN "item_variety"."variety_name" IS '品种名称';
COMMENT ON COLUMN "item_variety"."description" IS '品种描述';
COMMENT ON COLUMN "item_variety"."status" IS '状态: ACTIVE(启用) / DISABLED(停用)';
COMMENT ON COLUMN "item_variety"."created_by_id" IS '创建人用户ID';
COMMENT ON COLUMN "item_variety"."dept_id" IS '归属部门ID';
COMMENT ON COLUMN "item_variety"."updated_by_id" IS '最后更新人用户ID';
COMMENT ON COLUMN "item_variety"."is_deleted" IS '软删除标记';
COMMENT ON COLUMN "item_variety"."deleted_at" IS '软删除时间';
COMMENT ON COLUMN "item_variety"."deleted_by_id" IS '软删除操作人用户ID';
COMMENT ON COLUMN "item_variety"."created_at" IS '创建时间';
COMMENT ON COLUMN "item_variety"."updated_at" IS '更新时间';
COMMENT ON TABLE "position" IS '岗位模型 (实现 Position != Role 物理正交解耦)';
COMMENT ON COLUMN "position"."id" IS '岗位主键ID';
COMMENT ON COLUMN "position"."name" IS '岗位名称';
COMMENT ON COLUMN "position"."code" IS '岗位业务编码';
COMMENT ON COLUMN "position"."description" IS '岗位职责详细描述';
COMMENT ON COLUMN "position"."sort" IS '排序权重 (数字越小越靠前)';
COMMENT ON COLUMN "position"."status" IS '岗位状态: ACTIVE(正常) / DISABLED(停用)';
COMMENT ON COLUMN "position"."created_at" IS '创建时间';
COMMENT ON COLUMN "position"."updated_at" IS '更新时间';
COMMENT ON TABLE "process_master" IS '工序档案';
COMMENT ON COLUMN "process_master"."id" IS '工序主键ID';
COMMENT ON COLUMN "process_master"."process_code" IS '工序编码（如 PROC-001）';
COMMENT ON COLUMN "process_master"."process_name" IS '工序名称（如 分拣、清洗、去皮、切丝、包装）';
COMMENT ON COLUMN "process_master"."category" IS '工序分类: PRE_TREAT(预处理) / CLEAN(清洗) / CUT(切割) / SEASON(调理) / COOK(熟化) / PACK(包装)';
COMMENT ON COLUMN "process_master"."default_loss_rate" IS '默认损耗率(%)';
COMMENT ON COLUMN "process_master"."min_batch_qty" IS '最小批量';
COMMENT ON COLUMN "process_master"."std_labor_hours" IS '标准工时(小时)';
COMMENT ON COLUMN "process_master"."description" IS '工序描述';
COMMENT ON COLUMN "process_master"."status" IS '状态: ACTIVE(启用) / DISABLED(停用)';
COMMENT ON COLUMN "process_master"."created_by_id" IS '创建人用户ID';
COMMENT ON COLUMN "process_master"."dept_id" IS '归属部门ID';
COMMENT ON COLUMN "process_master"."updated_by_id" IS '最后更新人用户ID';
COMMENT ON COLUMN "process_master"."is_deleted" IS '软删除标记';
COMMENT ON COLUMN "process_master"."deleted_at" IS '软删除时间';
COMMENT ON COLUMN "process_master"."deleted_by_id" IS '软删除操作人用户ID';
COMMENT ON COLUMN "process_master"."created_at" IS '创建时间';
COMMENT ON COLUMN "process_master"."updated_at" IS '更新时间';
COMMENT ON TABLE "process_spec" IS '工序加工规格与指导参数';
COMMENT ON COLUMN "process_spec"."id" IS '规格主键ID';
COMMENT ON COLUMN "process_spec"."process_id" IS '所属工序ID';
COMMENT ON COLUMN "process_spec"."spec_code" IS '规格编码（如 SPEC-001）';
COMMENT ON COLUMN "process_spec"."spec_name" IS '规格名称（如 切丝5MM）';
COMMENT ON COLUMN "process_spec"."spec_params" IS '规格指导参数JSON';
COMMENT ON COLUMN "process_spec"."default_loss_rate" IS '规格专属默认损耗率(%)';
COMMENT ON COLUMN "process_spec"."status" IS '状态: ACTIVE(启用) / DISABLED(停用)';
COMMENT ON COLUMN "process_spec"."created_by_id" IS '创建人用户ID';
COMMENT ON COLUMN "process_spec"."dept_id" IS '归属部门ID';
COMMENT ON COLUMN "process_spec"."updated_by_id" IS '最后更新人用户ID';
COMMENT ON COLUMN "process_spec"."is_deleted" IS '软删除标记';
COMMENT ON COLUMN "process_spec"."deleted_at" IS '软删除时间';
COMMENT ON COLUMN "process_spec"."deleted_by_id" IS '软删除操作人用户ID';
COMMENT ON COLUMN "process_spec"."created_at" IS '创建时间';
COMMENT ON COLUMN "process_spec"."updated_at" IS '更新时间';
COMMENT ON TABLE "production_line" IS '生产产线档案';
COMMENT ON COLUMN "production_line"."id" IS '产线主键ID';
COMMENT ON COLUMN "production_line"."line_code" IS '产线业务编码';
COMMENT ON COLUMN "production_line"."line_name" IS '产线名称（如 蔬菜清洗切割线、荤菜加工线、包装分拣线）';
COMMENT ON COLUMN "production_line"."description" IS '产线说明';
COMMENT ON COLUMN "production_line"."status" IS '状态: ACTIVE(启用) / DISABLED(停用)';
COMMENT ON COLUMN "production_line"."created_by_id" IS '创建人用户ID';
COMMENT ON COLUMN "production_line"."dept_id" IS '归属部门ID';
COMMENT ON COLUMN "production_line"."updated_by_id" IS '最后更新人用户ID';
COMMENT ON COLUMN "production_line"."is_deleted" IS '软删除标记';
COMMENT ON COLUMN "production_line"."deleted_at" IS '软删除时间';
COMMENT ON COLUMN "production_line"."deleted_by_id" IS '软删除操作人用户ID';
COMMENT ON COLUMN "production_line"."created_at" IS '创建时间';
COMMENT ON COLUMN "production_line"."updated_at" IS '更新时间';
COMMENT ON TABLE "purchase_order" IS '采购订单业务模型 (核心 ERP 业务切片与 CASL 授权实体)';
COMMENT ON COLUMN "purchase_order"."id" IS '采购订单主键ID (CUID)';
COMMENT ON COLUMN "purchase_order"."order_no" IS '采购订单流水单号 (唯一)';
COMMENT ON COLUMN "purchase_order"."supplier_name" IS '供应商名称';
COMMENT ON COLUMN "purchase_order"."quantity" IS '采购商品总数量';
COMMENT ON COLUMN "purchase_order"."cost_price" IS '采购总成本金额';
COMMENT ON COLUMN "purchase_order"."dept_id" IS '归属采购部门ID';
COMMENT ON COLUMN "purchase_order"."created_by_id" IS '创建人用户ID';
COMMENT ON COLUMN "purchase_order"."updated_by_id" IS '最后更新人用户ID';
COMMENT ON COLUMN "purchase_order"."status" IS '采购订单状态: PENDING(待审核) / APPROVED(已通过) / REJECTED(已驳回)';
COMMENT ON COLUMN "purchase_order"."audit_comment" IS '审核意见或驳回备注';
COMMENT ON COLUMN "purchase_order"."is_deleted" IS '软删除标记';
COMMENT ON COLUMN "purchase_order"."deleted_at" IS '软删除时间';
COMMENT ON COLUMN "purchase_order"."deleted_by_id" IS '软删除操作人';
COMMENT ON COLUMN "purchase_order"."created_at" IS '订单创建时间';
COMMENT ON COLUMN "purchase_order"."updated_at" IS '订单最后更新时间';
COMMENT ON TABLE "sales_order" IS '销售订单单头：按 客户 + 门店 + 商品 + 数量 + 交货日期 维度的销售需求主单';
COMMENT ON COLUMN "sales_order"."order_id" IS '销售订单唯一单号（系统自动生成，格式 SO-YYYYMMDD-XXXX）';
COMMENT ON COLUMN "sales_order"."customer_code" IS '客户编码（关联 Customer）';
COMMENT ON COLUMN "sales_order"."store_code" IS '门店编码（关联 CustomerStore）';
COMMENT ON COLUMN "sales_order"."order_date" IS '下单日期';
COMMENT ON COLUMN "sales_order"."delivery_date" IS '交货日期';
COMMENT ON COLUMN "sales_order"."sales_person" IS '负责销售员';
COMMENT ON COLUMN "sales_order"."customer_tags" IS '客户标签快照（从客户档案带出）';
COMMENT ON COLUMN "sales_order"."department" IS '所属部门名称/编码';
COMMENT ON COLUMN "sales_order"."meal_period" IS '餐次：MORNING(早) / NOON(中) / EVENING(晚)（配送排程依据）';
COMMENT ON COLUMN "sales_order"."order_source" IS '订单来源：MANUAL(手动录单) / API(接口) / APP(小程序) / IMPORT(批量导入)';
COMMENT ON COLUMN "sales_order"."order_type" IS '订单类型：NORMAL(普通) / REPLENISHMENT(补货)';
COMMENT ON COLUMN "sales_order"."original_order_id" IS '关联原订单号（补货订单填写）';
COMMENT ON COLUMN "sales_order"."sorting_remark" IS '分拣备注（分拣员专用，区别于普通备注）';
COMMENT ON COLUMN "sales_order"."route_code" IS '配送线路编码';
COMMENT ON COLUMN "sales_order"."driver_code" IS '配送司机编码/名称';
COMMENT ON COLUMN "sales_order"."lock_status" IS '锁定状态：UNLOCKED(未锁定) / LOCKED(已锁定)（锁定后不可修改）';
COMMENT ON COLUMN "sales_order"."status" IS '审批状态：DRAFT(草稿) / PENDING(待审核) / APPROVED(已审核) / CANCELLED(已取消)';
COMMENT ON COLUMN "sales_order"."fulfillment_status" IS '履约状态：PENDING_SUMMARY(待汇总) / PRODUCING(生产中) / PRODUCED(生产完成) / READY_TO_SHIP(可发货) / SORTED(已分拣) / SHIPPED(已出库) / LOADED(已装车) / DELIVERING(配送中) / SIGNED(已签收)';
COMMENT ON COLUMN "sales_order"."settlement_status" IS '结算状态：UNRECONCILED(未对账) / RECONCILING(对账中) / CONFIRMED(已确认) / PARTIALLY_PAID(部分收款) / SETTLED(已结清)';
COMMENT ON COLUMN "sales_order"."outbound_status" IS '出库状态：PENDING_OUTBOUND(待出库) / OUTBOUNDED(已出库)';
COMMENT ON COLUMN "sales_order"."outbound_time" IS '出库时间（只读）';
COMMENT ON COLUMN "sales_order"."outbound_cost" IS '出库成本金额（只读，销售毛利计算基础）';
COMMENT ON COLUMN "sales_order"."related_outbound_id" IS '关联出库单号（只读）';
COMMENT ON COLUMN "sales_order"."receipt_status" IS '回单状态：UNRECEIVED(未回单) / RECEIVED(已回单)';
COMMENT ON COLUMN "sales_order"."print_status" IS '打印状态：UNPRINTED(未打印) / PRINTED(已打印)';
COMMENT ON COLUMN "sales_order"."total_amount" IS '订单总金额（含税，按明细汇总）';
COMMENT ON COLUMN "sales_order"."remark" IS '备注说明';
COMMENT ON COLUMN "sales_order"."created_by_id" IS '创建人用户ID (数据范围 SELF 核心依据)';
COMMENT ON COLUMN "sales_order"."dept_id" IS '归属部门ID (数据范围 DEPT / DEPT_TREE 核心依据)';
COMMENT ON COLUMN "sales_order"."updated_by_id" IS '最后更新人用户ID';
COMMENT ON COLUMN "sales_order"."is_deleted" IS '软删除标记 (默认 false)';
COMMENT ON COLUMN "sales_order"."deleted_at" IS '软删除时间';
COMMENT ON COLUMN "sales_order"."deleted_by_id" IS '软删除操作人用户ID';
COMMENT ON COLUMN "sales_order"."created_at" IS '创建时间';
COMMENT ON COLUMN "sales_order"."updated_at" IS '更新时间';
COMMENT ON TABLE "sales_order_fee" IS '销售订单附加费用明细：快递费、材料费、包装费等，独立复核';
COMMENT ON COLUMN "sales_order_fee"."fee_id" IS '费用主键（自动生成，格式 SOF-YYYYMMDD-XXXX-XX）';
COMMENT ON COLUMN "sales_order_fee"."order_id" IS '关联订单号';
COMMENT ON COLUMN "sales_order_fee"."fee_type" IS '费用类型：EXPRESS(快递费) / MATERIAL(材料费) / PACKAGING(包装费) / FREIGHT(运费) / OTHER(其他)';
COMMENT ON COLUMN "sales_order_fee"."fee_amount" IS '费用金额（正数为应收，负数为折让）';
COMMENT ON COLUMN "sales_order_fee"."remark" IS '费用说明/备注';
COMMENT ON COLUMN "sales_order_fee"."audit_status" IS '复核状态：DRAFT(草稿) / PENDING(待复核) / APPROVED(已复核) / REJECTED(已驳回)';
COMMENT ON COLUMN "sales_order_fee"."created_by_id" IS '录入人用户ID';
COMMENT ON COLUMN "sales_order_fee"."audited_by_id" IS '复核人用户ID';
COMMENT ON COLUMN "sales_order_fee"."audited_at" IS '复核时间';
COMMENT ON COLUMN "sales_order_fee"."created_at" IS '创建时间';
COMMENT ON COLUMN "sales_order_fee"."updated_at" IS '更新时间';
COMMENT ON TABLE "sales_order_item" IS '销售订单明细行：具体采购的商品、数量、单价与履约进度';
COMMENT ON COLUMN "sales_order_item"."order_detail_id" IS '订单明细主键（自动生成，格式 SOD-YYYYMMDD-XXXX-XX）';
COMMENT ON COLUMN "sales_order_item"."order_id" IS '所属销售订单号';
COMMENT ON COLUMN "sales_order_item"."item_code" IS '商品档案唯一编码';
COMMENT ON COLUMN "sales_order_item"."item_name" IS '商品名称';
COMMENT ON COLUMN "sales_order_item"."sales_unit" IS '销售单位（如：kg、箱、袋）';
COMMENT ON COLUMN "sales_order_item"."order_qty" IS '订单订购数量';
COMMENT ON COLUMN "sales_order_item"."inbound_qty" IS '已入库数量（成品入库后回写）';
COMMENT ON COLUMN "sales_order_item"."signed_qty" IS '签收数量（门店签收后回写，用于对账结算）';
COMMENT ON COLUMN "sales_order_item"."fulfillment_status" IS '明细履约状态：PENDING_PRODUCE(待生产) / PRODUCING(生产中) / PARTIAL_INBOUND(部分入库) / READY_TO_SHIP(可发货)';
COMMENT ON COLUMN "sales_order_item"."unit_price_excl_tax" IS '不含税单价（元）';
COMMENT ON COLUMN "sales_order_item"."unit_price_incl_tax" IS '含税销售单价（元）';
COMMENT ON COLUMN "sales_order_item"."tax_rate" IS '适用增值税税率(%)，如 9.00';
COMMENT ON COLUMN "sales_order_item"."subtotal_amount" IS '明细含税小计金额 (orderQty * unitPriceInclTax)';
COMMENT ON COLUMN "sales_order_item"."remark" IS '备注说明';
COMMENT ON TABLE "tenant_menu_item" IS '租户动态导航菜单配置模型 (支持现场层级调整、自定义别名与跨切片灵活编排)';
COMMENT ON COLUMN "tenant_menu_item"."id" IS '节点主键ID';
COMMENT ON COLUMN "tenant_menu_item"."parent_id" IS '父节点ID (空表示顶级大菜单/顶级单页)';
COMMENT ON COLUMN "tenant_menu_item"."item_type" IS '节点类型: GROUP(大菜单/目录分组) | PAGE(具体功能页面) | LINK(外部链接)';
COMMENT ON COLUMN "tenant_menu_item"."page_key" IS '关联的标准页面键名 (若 itemType="PAGE"，对应 StandardPageDescriptor.pageKey)';
COMMENT ON COLUMN "tenant_menu_item"."external_url" IS '外部跳转 URL (若 itemType="LINK"，如 "https://bi.company.com")';
COMMENT ON COLUMN "tenant_menu_item"."open_in_new_tab" IS '是否在新标签页打开';
COMMENT ON COLUMN "tenant_menu_item"."custom_label" IS '自定义显示别名 (现场实施重命名；空则使用页面契约 defaultLabel)';
COMMENT ON COLUMN "tenant_menu_item"."custom_icon" IS '自定义图标名称 (空则使用页面契约 defaultIcon)';
COMMENT ON COLUMN "tenant_menu_item"."sort_order" IS '排序权重 (升序排列)';
COMMENT ON COLUMN "tenant_menu_item"."is_visible" IS '是否可见';
COMMENT ON COLUMN "tenant_menu_item"."created_by_id" IS '创建人 ID';
COMMENT ON COLUMN "tenant_menu_item"."dept_id" IS '归属部门 ID';
COMMENT ON COLUMN "tenant_menu_item"."updated_by_id" IS '更新人 ID';
COMMENT ON COLUMN "tenant_menu_item"."created_at" IS '创建时间';
COMMENT ON COLUMN "tenant_menu_item"."updated_at" IS '更新时间';
COMMENT ON COLUMN "tenant_menu_item"."is_deleted" IS '软删除标记';
COMMENT ON COLUMN "tenant_menu_item"."deleted_at" IS '软删除时间';
COMMENT ON COLUMN "tenant_menu_item"."deleted_by_id" IS '软删除人 ID';
COMMENT ON TABLE "unit_conversion" IS '多单位换算规则（支持物料专有换算与全局规则）';
COMMENT ON COLUMN "unit_conversion"."id" IS '换算规则主键ID';
COMMENT ON COLUMN "unit_conversion"."item_code" IS '绑定特定物料编码（为空代表全局通用规则）';
COMMENT ON COLUMN "unit_conversion"."from_unit_id" IS '源单位ID';
COMMENT ON COLUMN "unit_conversion"."to_unit_id" IS '目标单位ID';
COMMENT ON COLUMN "unit_conversion"."conversion_rate" IS '换算率: toQty = fromQty * conversionRate';
COMMENT ON COLUMN "unit_conversion"."created_by_id" IS '创建人用户ID';
COMMENT ON COLUMN "unit_conversion"."dept_id" IS '归属部门ID';
COMMENT ON COLUMN "unit_conversion"."updated_by_id" IS '最后更新人用户ID';
COMMENT ON COLUMN "unit_conversion"."is_deleted" IS '软删除标记';
COMMENT ON COLUMN "unit_conversion"."deleted_at" IS '软删除时间';
COMMENT ON COLUMN "unit_conversion"."deleted_by_id" IS '软删除操作人用户ID';
COMMENT ON COLUMN "unit_conversion"."created_at" IS '创建时间';
COMMENT ON COLUMN "unit_conversion"."updated_at" IS '更新时间';
COMMENT ON TABLE "unit_of_measure" IS '计量单位字典';
COMMENT ON COLUMN "unit_of_measure"."id" IS '计量单位主键ID';
COMMENT ON COLUMN "unit_of_measure"."unit_code" IS '单位编码（如 kg, g, jin, bag, box）';
COMMENT ON COLUMN "unit_of_measure"."unit_name" IS '单位名称（如 千克、克、斤、包、盒）';
COMMENT ON COLUMN "unit_of_measure"."unit_type" IS '度量类别: WEIGHT(重量) / COUNT(计件) / VOLUME(体积)';
COMMENT ON COLUMN "unit_of_measure"."base_ratio" IS '相对于度量基准折算率 (克为基准: 1斤=500, 1kg=1000)';
COMMENT ON COLUMN "unit_of_measure"."is_base_unit" IS '是否该类别系统基准单位';
COMMENT ON COLUMN "unit_of_measure"."status" IS '状态: ACTIVE(启用) / DISABLED(停用)';
COMMENT ON COLUMN "unit_of_measure"."created_by_id" IS '创建人用户ID';
COMMENT ON COLUMN "unit_of_measure"."dept_id" IS '归属部门ID';
COMMENT ON COLUMN "unit_of_measure"."updated_by_id" IS '最后更新人用户ID';
COMMENT ON COLUMN "unit_of_measure"."is_deleted" IS '软删除标记';
COMMENT ON COLUMN "unit_of_measure"."deleted_at" IS '软删除时间';
COMMENT ON COLUMN "unit_of_measure"."deleted_by_id" IS '软删除操作人用户ID';
COMMENT ON COLUMN "unit_of_measure"."created_at" IS '创建时间';
COMMENT ON COLUMN "unit_of_measure"."updated_at" IS '更新时间';
