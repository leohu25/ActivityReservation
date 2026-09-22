-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "attachment" (
    "id" UUID NOT NULL,
    "module" VARCHAR(50) NOT NULL,
    "target_id" VARCHAR(64),
    "field_key" VARCHAR(50),
    "file_name" VARCHAR(255) NOT NULL,
    "storage_key" VARCHAR(500) NOT NULL,
    "file_url" VARCHAR(1000) NOT NULL,
    "file_size" BIGINT NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "created_by_id" UUID NOT NULL DEFAULT '00000000-0000-7000-8000-000000000000',
    "dept_id" UUID,
    "updated_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "deleted_by_id" UUID,

    CONSTRAINT "attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_profile" (
    "id" UUID NOT NULL,
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
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "category_id" UUID NOT NULL,
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
    "created_by_id" UUID NOT NULL,
    "dept_id" UUID,
    "updated_by_id" UUID,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "deleted_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_category" (
    "id" UUID NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "parent_id" UUID,
    "description" VARCHAR(200),
    "status" VARCHAR(10) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_quote" (
    "id" UUID NOT NULL,
    "quote_no" VARCHAR(30) NOT NULL,
    "customer_id" UUID,
    "store_id" UUID,
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
    "created_by_id" UUID NOT NULL,
    "dept_id" UUID,
    "updated_by_id" UUID,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "deleted_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_quote_item" (
    "id" UUID NOT NULL,
    "quote_id" UUID NOT NULL,
    "item_code" VARCHAR(50) NOT NULL,
    "item_name" VARCHAR(100) NOT NULL,
    "sales_unit" VARCHAR(20) NOT NULL,
    "unit_price_excl_tax" DECIMAL(10,2) NOT NULL,
    "unit_price_incl_tax" DECIMAL(10,2) NOT NULL,
    "tax_rate" DECIMAL(5,2) NOT NULL,
    "min_qty" DECIMAL(10,2),
    "max_qty" DECIMAL(10,2),
    "remark" VARCHAR(200),

    CONSTRAINT "customer_quote_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_store" (
    "id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
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
    "created_by_id" UUID NOT NULL,
    "dept_id" UUID,
    "updated_by_id" UUID,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "deleted_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_tag" (
    "id" UUID NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "tag_type_id" UUID,
    "description" VARCHAR(200),
    "status" VARCHAR(10) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_tag_assignment" (
    "customer_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_tag_assignment_pkey" PRIMARY KEY ("customer_id","tag_id")
);

-- CreateTable
CREATE TABLE "department" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "parent_id" UUID,
    "leader_member_id" TEXT,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_profile" (
    "id" UUID NOT NULL,
    "member_id" TEXT,
    "user_id" TEXT,
    "invitation_id" TEXT,
    "employee_no" TEXT,
    "department_id" UUID,
    "position_id" UUID,
    "manager_employee_id" UUID,
    "name" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "phone" TEXT,
    "job_title" TEXT,
    "avatar_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "joined_at" TIMESTAMP(3),
    "terminated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "position" (
    "id" UUID NOT NULL,
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
CREATE TABLE "tenant_dict_item" (
    "id" UUID NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "status" VARCHAR(10) NOT NULL DEFAULT 'ACTIVE',
    "sort" INTEGER NOT NULL DEFAULT 0,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "remark" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_dict_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_menu_item" (
    "id" UUID NOT NULL,
    "parent_id" UUID,
    "item_type" TEXT NOT NULL DEFAULT 'PAGE',
    "page_key" TEXT,
    "external_url" TEXT,
    "open_in_new_tab" BOOLEAN NOT NULL DEFAULT false,
    "custom_label" TEXT,
    "custom_icon" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "created_by_id" UUID NOT NULL DEFAULT '00000000-0000-7000-8000-000000000000',
    "dept_id" UUID,
    "updated_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "deleted_by_id" UUID,

    CONSTRAINT "tenant_menu_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "attachment_target_id_module_idx" ON "attachment"("target_id", "module");

-- CreateIndex
CREATE INDEX "attachment_created_by_id_idx" ON "attachment"("created_by_id");

-- CreateIndex
CREATE INDEX "customer_category_id_idx" ON "customer"("category_id");

-- CreateIndex
CREATE INDEX "customer_status_idx" ON "customer"("status");

-- CreateIndex
CREATE INDEX "customer_is_deleted_idx" ON "customer"("is_deleted");

-- CreateIndex
CREATE INDEX "customer_category_parent_id_idx" ON "customer_category"("parent_id");

-- CreateIndex
CREATE INDEX "customer_category_status_idx" ON "customer_category"("status");

-- CreateIndex
CREATE UNIQUE INDEX "customer_quote_quote_no_key" ON "customer_quote"("quote_no");

-- CreateIndex
CREATE INDEX "customer_quote_customer_id_idx" ON "customer_quote"("customer_id");

-- CreateIndex
CREATE INDEX "customer_quote_store_id_idx" ON "customer_quote"("store_id");

-- CreateIndex
CREATE INDEX "customer_quote_region_code_idx" ON "customer_quote"("region_code");

-- CreateIndex
CREATE INDEX "customer_quote_status_idx" ON "customer_quote"("status");

-- CreateIndex
CREATE INDEX "customer_quote_is_deleted_idx" ON "customer_quote"("is_deleted");

-- CreateIndex
CREATE INDEX "customer_quote_item_quote_id_idx" ON "customer_quote_item"("quote_id");

-- CreateIndex
CREATE INDEX "customer_quote_item_item_code_idx" ON "customer_quote_item"("item_code");

-- CreateIndex
CREATE INDEX "customer_store_customer_id_idx" ON "customer_store"("customer_id");

-- CreateIndex
CREATE INDEX "customer_store_region_code_idx" ON "customer_store"("region_code");

-- CreateIndex
CREATE INDEX "customer_store_status_idx" ON "customer_store"("status");

-- CreateIndex
CREATE INDEX "customer_store_is_deleted_idx" ON "customer_store"("is_deleted");

-- CreateIndex
CREATE INDEX "customer_tag_tag_type_id_idx" ON "customer_tag"("tag_type_id");

-- CreateIndex
CREATE INDEX "customer_tag_status_idx" ON "customer_tag"("status");

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
CREATE INDEX "tenant_dict_item_type_status_idx" ON "tenant_dict_item"("type", "status");

-- CreateIndex
CREATE INDEX "tenant_dict_item_status_idx" ON "tenant_dict_item"("status");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_dict_item_type_code_key" ON "tenant_dict_item"("type", "code");

-- CreateIndex
CREATE INDEX "tenant_menu_item_parent_id_sort_order_idx" ON "tenant_menu_item"("parent_id", "sort_order");

-- CreateIndex
CREATE INDEX "tenant_menu_item_is_deleted_idx" ON "tenant_menu_item"("is_deleted");

-- Database Comments
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
COMMENT ON COLUMN "attachment"."created_by_id" IS '创建人 ID (必填，审计基线，UUIDv7)';
COMMENT ON COLUMN "attachment"."dept_id" IS '归属部门 ID (选填，支持部门数据范围权限过滤，UUIDv7)';
COMMENT ON COLUMN "attachment"."updated_by_id" IS '更新人 ID (选填，UUIDv7)';
COMMENT ON COLUMN "attachment"."created_at" IS '创建时间 (必填)';
COMMENT ON COLUMN "attachment"."updated_at" IS '更新时间 (必填)';
COMMENT ON COLUMN "attachment"."is_deleted" IS '软删除标记 (必填)';
COMMENT ON COLUMN "attachment"."deleted_at" IS '软删除时间 (选填)';
COMMENT ON COLUMN "attachment"."deleted_by_id" IS '软删除人 ID (选填，UUIDv7)';
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
COMMENT ON TABLE "customer" IS '客户档案主表：维护企业级客户的基本信息与结算主数据';
COMMENT ON COLUMN "customer"."id" IS '客户主键ID (UUIDv7)';
COMMENT ON COLUMN "customer"."name" IS '客户企业名称';
COMMENT ON COLUMN "customer"."category_id" IS '所属客户分类主键ID';
COMMENT ON COLUMN "customer"."contact_person" IS '核心联系人姓名';
COMMENT ON COLUMN "customer"."contact_phone" IS '联系电话';
COMMENT ON COLUMN "customer"."settlement_method" IS '结算方式：MONTHLY(月结) / CASH(现结) / PREPAID(预付)';
COMMENT ON COLUMN "customer"."default_tax_rate" IS '默认税率(%)，如 9.00 表示 9%';
COMMENT ON COLUMN "customer"."credit_limit" IS '授信信用额度(元)';
COMMENT ON COLUMN "customer"."customer_tags" IS '客户标签摘要缓存（冗余字段，方便快速搜索展示）';
COMMENT ON COLUMN "customer"."sales_person" IS '负责销售经理 / 业务员姓名或工号';
COMMENT ON COLUMN "customer"."default_warehouse" IS '默认发货仓库标识';
COMMENT ON COLUMN "customer"."payment_cycle" IS '付款周期：WEEKLY(周结) / BIWEEKLY(半月结) / MONTHLY(月结)';
COMMENT ON COLUMN "customer"."service_time" IS '服务收货时间窗口（如：早8:00-10:00）';
COMMENT ON COLUMN "customer"."last_order_time" IS '最近下单履约时间（系统只读自动更新）';
COMMENT ON COLUMN "customer"."status" IS '客户状态：ACTIVE(正常) / DISABLED(停用)';
COMMENT ON COLUMN "customer"."created_by_id" IS '创建人用户ID';
COMMENT ON COLUMN "customer"."dept_id" IS '归属部门ID (用于数据范围判定)';
COMMENT ON COLUMN "customer"."updated_by_id" IS '最后更新人用户ID';
COMMENT ON COLUMN "customer"."is_deleted" IS '软删除标记';
COMMENT ON COLUMN "customer"."deleted_at" IS '软删除时间';
COMMENT ON COLUMN "customer"."deleted_by_id" IS '软删除操作人用户ID';
COMMENT ON COLUMN "customer"."created_at" IS '创建时间';
COMMENT ON COLUMN "customer"."updated_at" IS '更新时间';
COMMENT ON TABLE "customer_category" IS '客户分类表：支持多级层级树结构（如餐饮连锁、企事业单位、生鲜超市）';
COMMENT ON COLUMN "customer_category"."id" IS '分类主键ID (UUIDv7)';
COMMENT ON COLUMN "customer_category"."name" IS '分类名称（如：机关食堂、品牌连锁）';
COMMENT ON COLUMN "customer_category"."parent_id" IS '父级分类主键ID（支持多级分类树，根级为空）';
COMMENT ON COLUMN "customer_category"."description" IS '分类业务描述';
COMMENT ON COLUMN "customer_category"."status" IS '状态：ACTIVE(启用) / DISABLED(停用)';
COMMENT ON COLUMN "customer_category"."created_at" IS '创建时间';
COMMENT ON COLUMN "customer_category"."updated_at" IS '更新时间';
COMMENT ON TABLE "customer_quote" IS '门店报价单主表：按客户+门店+区域维护的商品定价单头';
COMMENT ON COLUMN "customer_quote"."id" IS '报价单主键ID (UUIDv7)';
COMMENT ON COLUMN "customer_quote"."quote_no" IS '报价单业务单号（对外沟通展示与防重，格式 QUOT-YYYYMMDD-XXXX）';
COMMENT ON COLUMN "customer_quote"."customer_id" IS '适用客户主键ID（与 storeId、regionCode 构成维度优先级）';
COMMENT ON COLUMN "customer_quote"."store_id" IS '适用门店主键ID（为空则适用于该客户下属所有门店）';
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
COMMENT ON COLUMN "customer_quote_item"."id" IS '报价明细行主键ID (UUIDv7)';
COMMENT ON COLUMN "customer_quote_item"."quote_id" IS '所属报价单主表ID';
COMMENT ON COLUMN "customer_quote_item"."item_code" IS '商品档案唯一编码（关联物料商品中心）';
COMMENT ON COLUMN "customer_quote_item"."item_name" IS '商品名称（如：特级上海青(净菜)）';
COMMENT ON COLUMN "customer_quote_item"."sales_unit" IS '销售计量单位（如：kg、箱、袋）';
COMMENT ON COLUMN "customer_quote_item"."unit_price_excl_tax" IS '不含税单价（元）';
COMMENT ON COLUMN "customer_quote_item"."unit_price_incl_tax" IS '含税销售单价（元）';
COMMENT ON COLUMN "customer_quote_item"."tax_rate" IS '适用增值税税率(%)，如 9.00';
COMMENT ON COLUMN "customer_quote_item"."min_qty" IS '最小起订量限制';
COMMENT ON COLUMN "customer_quote_item"."max_qty" IS '最大限购量限制';
COMMENT ON COLUMN "customer_quote_item"."remark" IS '明细备注说明';
COMMENT ON TABLE "customer_store" IS '门店档案主表：客户下属的履约单位（订单、配送、签收、对账最小主体）';
COMMENT ON COLUMN "customer_store"."id" IS '门店主键ID (UUIDv7)';
COMMENT ON COLUMN "customer_store"."customer_id" IS '所属客户主键ID（外键关联 Customer.id）';
COMMENT ON COLUMN "customer_store"."name" IS '门店详细名称（如：海淀中关村一店）';
COMMENT ON COLUMN "customer_store"."address" IS '门店配送收货详细地址';
COMMENT ON COLUMN "customer_store"."contact_person" IS '门店现场联系人';
COMMENT ON COLUMN "customer_store"."contact_phone" IS '门店联系电话';
COMMENT ON COLUMN "customer_store"."delivery_period" IS '配送时段：MORNING(早) / NOON(中) / EVENING(晚)';
COMMENT ON COLUMN "customer_store"."default_route" IS '默认配送路线编码';
COMMENT ON COLUMN "customer_store"."default_driver" IS '默认配送司机名称或工号';
COMMENT ON COLUMN "customer_store"."store_tags" IS '门店标签摘要（如 VIP门店、商圈旗舰）';
COMMENT ON COLUMN "customer_store"."region_code" IS '所属区域编码（必填，用于区域报价匹配与物流调度）';
COMMENT ON COLUMN "customer_store"."billing_contact" IS '结款财务联系人（门店现场收货人≠结款人时使用）';
COMMENT ON COLUMN "customer_store"."billing_phone" IS '结款财务联系人电话';
COMMENT ON COLUMN "customer_store"."status" IS '门店状态：ACTIVE(正常) / DISABLED(停用)';
COMMENT ON COLUMN "customer_store"."created_by_id" IS '创建人用户ID';
COMMENT ON COLUMN "customer_store"."dept_id" IS '归属部门ID';
COMMENT ON COLUMN "customer_store"."updated_by_id" IS '最后更新人用户ID';
COMMENT ON COLUMN "customer_store"."is_deleted" IS '软删除标记';
COMMENT ON COLUMN "customer_store"."deleted_at" IS '软删除时间';
COMMENT ON COLUMN "customer_store"."deleted_by_id" IS '软删除操作人用户ID';
COMMENT ON COLUMN "customer_store"."created_at" IS '创建时间';
COMMENT ON COLUMN "customer_store"."updated_at" IS '更新时间';
COMMENT ON TABLE "customer_tag" IS '客户标签字典表：用于筛选、统计、报价与配送策略';
COMMENT ON COLUMN "customer_tag"."id" IS '标签主键ID (UUIDv7)';
COMMENT ON COLUMN "customer_tag"."name" IS '标签名称（如：早间配送、VIP客户、学校食堂）';
COMMENT ON COLUMN "customer_tag"."tag_type_id" IS '业务标签类型ID：关联基础档案 tenant_dict_item 的主键 id';
COMMENT ON COLUMN "customer_tag"."description" IS '标签业务说明';
COMMENT ON COLUMN "customer_tag"."status" IS '状态：ACTIVE(启用) / DISABLED(停用)';
COMMENT ON COLUMN "customer_tag"."created_at" IS '创建时间';
COMMENT ON COLUMN "customer_tag"."updated_at" IS '更新时间';
COMMENT ON TABLE "customer_tag_assignment" IS '客户与标签多对多关联表';
COMMENT ON COLUMN "customer_tag_assignment"."customer_id" IS '客户主键ID';
COMMENT ON COLUMN "customer_tag_assignment"."tag_id" IS '标签主键ID';
COMMENT ON COLUMN "customer_tag_assignment"."created_at" IS '关联打标时间';
COMMENT ON TABLE "department" IS '部门拓扑模型 (用于数据范围 DEPT / DEPT_TREE 判定)';
COMMENT ON COLUMN "department"."id" IS '部门主键ID (UUIDv7)';
COMMENT ON COLUMN "department"."name" IS '部门名称';
COMMENT ON COLUMN "department"."code" IS '部门业务编码';
COMMENT ON COLUMN "department"."parent_id" IS '父级部门ID (支持树状拓扑)';
COMMENT ON COLUMN "department"."leader_member_id" IS '部门分管领导/主管成员ID (关联平台 Member.id)';
COMMENT ON COLUMN "department"."sort" IS '显示排序权重 (数字越小越靠前)';
COMMENT ON COLUMN "department"."status" IS '部门状态: ACTIVE(正常) / DISABLED(停用)';
COMMENT ON COLUMN "department"."created_at" IS '创建时间';
COMMENT ON COLUMN "department"."updated_at" IS '更新时间';
COMMENT ON TABLE "employee_profile" IS '租户内员工档案模型 (对应 Control DB Member.id，组织人事与数据范围事实源)';
COMMENT ON COLUMN "employee_profile"."id" IS '员工档案主键ID';
COMMENT ON COLUMN "employee_profile"."member_id" IS '关联平台租户成员主键 (Control DB Member.id)';
COMMENT ON COLUMN "employee_profile"."user_id" IS '关联平台用户账号ID (Control DB User.id)';
COMMENT ON COLUMN "employee_profile"."invitation_id" IS '邀请记录ID (关联邀请审核流)';
COMMENT ON COLUMN "employee_profile"."employee_no" IS '员工工号 (企业内部唯一)';
COMMENT ON COLUMN "employee_profile"."department_id" IS '所属部门主键ID';
COMMENT ON COLUMN "employee_profile"."position_id" IS '所属岗位主键ID';
COMMENT ON COLUMN "employee_profile"."manager_employee_id" IS '直属上级经理档案ID';
COMMENT ON COLUMN "employee_profile"."name" IS '员工姓名';
COMMENT ON COLUMN "employee_profile"."email" IS '员工工作邮箱';
COMMENT ON COLUMN "employee_profile"."phone" IS '员工手机号';
COMMENT ON COLUMN "employee_profile"."job_title" IS '职务头衔/对外称谓';
COMMENT ON COLUMN "employee_profile"."avatar_url" IS '员工头像/工牌照 URL';
COMMENT ON COLUMN "employee_profile"."status" IS '员工在职状态: ACTIVE(在职) / TERMINATED(离职) / SUSPENDED(停职)';
COMMENT ON COLUMN "employee_profile"."joined_at" IS '入职报到时间';
COMMENT ON COLUMN "employee_profile"."terminated_at" IS '离职归档时间';
COMMENT ON COLUMN "employee_profile"."created_at" IS '档案创建时间';
COMMENT ON COLUMN "employee_profile"."updated_at" IS '档案最后更新时间';
COMMENT ON TABLE "position" IS '岗位模型 (实现 Position != Role 物理正交解耦)';
COMMENT ON COLUMN "position"."id" IS '岗位主键ID';
COMMENT ON COLUMN "position"."name" IS '岗位名称';
COMMENT ON COLUMN "position"."code" IS '岗位业务编码';
COMMENT ON COLUMN "position"."description" IS '岗位职责详细描述';
COMMENT ON COLUMN "position"."sort" IS '排序权重 (数字越小越靠前)';
COMMENT ON COLUMN "position"."status" IS '岗位状态: ACTIVE(正常) / DISABLED(停用)';
COMMENT ON COLUMN "position"."created_at" IS '创建时间';
COMMENT ON COLUMN "position"."updated_at" IS '更新时间';
COMMENT ON TABLE "tenant_dict_item" IS '租户业务基础档案数据字典项表 (租户全域共享配置字典，通过 status 启停用)';
COMMENT ON COLUMN "tenant_dict_item"."id" IS '字典项主键ID (UUIDv7)';
COMMENT ON COLUMN "tenant_dict_item"."type" IS '字典类型编码 (as const 枚举分类，例如 CUSTOMER_LEVEL)';
COMMENT ON COLUMN "tenant_dict_item"."code" IS '字典项业务编码 (同一 type 下唯一)';
COMMENT ON COLUMN "tenant_dict_item"."name" IS '字典项显示名称';
COMMENT ON COLUMN "tenant_dict_item"."status" IS '状态：ACTIVE(启用) / DISABLED(停用)';
COMMENT ON COLUMN "tenant_dict_item"."sort" IS '显示排序权重 (数字越小越靠前)';
COMMENT ON COLUMN "tenant_dict_item"."is_default" IS '是否默认选中项';
COMMENT ON COLUMN "tenant_dict_item"."remark" IS '备注说明';
COMMENT ON COLUMN "tenant_dict_item"."created_at" IS '创建时间';
COMMENT ON COLUMN "tenant_dict_item"."updated_at" IS '更新时间';
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
COMMENT ON COLUMN "tenant_menu_item"."created_by_id" IS '创建人 ID (UUIDv7，系统写入为 SYSTEM_ACTOR_ID)';
COMMENT ON COLUMN "tenant_menu_item"."dept_id" IS '归属部门 ID (UUIDv7)';
COMMENT ON COLUMN "tenant_menu_item"."updated_by_id" IS '更新人 ID (UUIDv7)';
COMMENT ON COLUMN "tenant_menu_item"."created_at" IS '创建时间';
COMMENT ON COLUMN "tenant_menu_item"."updated_at" IS '更新时间';
COMMENT ON COLUMN "tenant_menu_item"."is_deleted" IS '软删除标记';
COMMENT ON COLUMN "tenant_menu_item"."deleted_at" IS '软删除时间';
COMMENT ON COLUMN "tenant_menu_item"."deleted_by_id" IS '软删除人 ID (UUIDv7)';
