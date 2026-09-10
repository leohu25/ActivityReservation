-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

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
CREATE TABLE "purchase_order" (
    "id" TEXT NOT NULL,
    "order_no" TEXT NOT NULL,
    "supplier_name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "cost_price" DECIMAL(12,2) NOT NULL,
    "dept_id" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "audit_comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_order_pkey" PRIMARY KEY ("id")
);

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
CREATE UNIQUE INDEX "position_code_key" ON "position"("code");

-- CreateIndex
CREATE INDEX "position_status_idx" ON "position"("status");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_order_order_no_key" ON "purchase_order"("order_no");

-- CreateIndex
CREATE INDEX "purchase_order_dept_id_idx" ON "purchase_order"("dept_id");

-- CreateIndex
CREATE INDEX "purchase_order_created_by_id_idx" ON "purchase_order"("created_by_id");

-- CreateIndex
CREATE INDEX "purchase_order_status_idx" ON "purchase_order"("status");

-- AddForeignKey
ALTER TABLE "customer" ADD CONSTRAINT "customer_category_code_fkey" FOREIGN KEY ("category_code") REFERENCES "customer_category"("category_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_category" ADD CONSTRAINT "customer_category_parent_code_fkey" FOREIGN KEY ("parent_code") REFERENCES "customer_category"("category_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_quote" ADD CONSTRAINT "customer_quote_customer_code_fkey" FOREIGN KEY ("customer_code") REFERENCES "customer"("customer_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_quote" ADD CONSTRAINT "customer_quote_store_code_fkey" FOREIGN KEY ("store_code") REFERENCES "customer_store"("store_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_quote_item" ADD CONSTRAINT "customer_quote_item_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "customer_quote"("quote_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_store" ADD CONSTRAINT "customer_store_customer_code_fkey" FOREIGN KEY ("customer_code") REFERENCES "customer"("customer_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_tag_assignment" ADD CONSTRAINT "customer_tag_assignment_customer_code_fkey" FOREIGN KEY ("customer_code") REFERENCES "customer"("customer_code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_tag_assignment" ADD CONSTRAINT "customer_tag_assignment_tag_code_fkey" FOREIGN KEY ("tag_code") REFERENCES "customer_tag"("tag_code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_profile" ADD CONSTRAINT "employee_profile_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_profile" ADD CONSTRAINT "employee_profile_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "position"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_profile" ADD CONSTRAINT "employee_profile_manager_employee_id_fkey" FOREIGN KEY ("manager_employee_id") REFERENCES "employee_profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order" ADD CONSTRAINT "purchase_order_dept_id_fkey" FOREIGN KEY ("dept_id") REFERENCES "department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

