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

-- Database Comments
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
COMMENT ON COLUMN "customer"."customer_code" IS '客户全局唯一编码（系统自增生成，格式 CUST-YYYYMMDD-XXXX）';
COMMENT ON COLUMN "customer"."customer_name" IS '客户企业名称';
COMMENT ON COLUMN "customer"."category_code" IS '所属客户分类编码';
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
COMMENT ON COLUMN "customer"."created_at" IS '创建时间';
COMMENT ON COLUMN "customer"."updated_at" IS '更新时间';
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
COMMENT ON TABLE "customer_store" IS '门店档案主表：客户下属的履约单位（订单、配送、签收、对账最小主体）';
COMMENT ON COLUMN "customer_store"."store_code" IS '门店全局唯一编码（系统自动生成，格式 STOR-YYYYMMDD-XXXX）';
COMMENT ON COLUMN "customer_store"."customer_code" IS '所属客户编码（外键关联 Customer）';
COMMENT ON COLUMN "customer_store"."store_name" IS '门店详细名称（如：海淀中关村一店）';
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
COMMENT ON COLUMN "customer_store"."created_at" IS '创建时间';
COMMENT ON COLUMN "customer_store"."updated_at" IS '更新时间';
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
COMMENT ON TABLE "position" IS '岗位模型 (实现 Position != Role 物理正交解耦)';
COMMENT ON COLUMN "position"."id" IS '岗位主键ID';
COMMENT ON COLUMN "position"."name" IS '岗位名称';
COMMENT ON COLUMN "position"."code" IS '岗位业务编码';
COMMENT ON COLUMN "position"."description" IS '岗位职责详细描述';
COMMENT ON COLUMN "position"."sort" IS '排序权重 (数字越小越靠前)';
COMMENT ON COLUMN "position"."status" IS '岗位状态: ACTIVE(正常) / DISABLED(停用)';
COMMENT ON COLUMN "position"."created_at" IS '创建时间';
COMMENT ON COLUMN "position"."updated_at" IS '更新时间';
COMMENT ON TABLE "purchase_order" IS '采购订单业务模型 (核心 ERP 业务切片与 CASL 授权实体)';
COMMENT ON COLUMN "purchase_order"."id" IS '采购订单主键ID (CUID)';
COMMENT ON COLUMN "purchase_order"."order_no" IS '采购订单流水单号 (唯一)';
COMMENT ON COLUMN "purchase_order"."supplier_name" IS '供应商名称';
COMMENT ON COLUMN "purchase_order"."quantity" IS '采购商品总数量';
COMMENT ON COLUMN "purchase_order"."cost_price" IS '采购总成本金额';
COMMENT ON COLUMN "purchase_order"."dept_id" IS '归属采购部门ID';
COMMENT ON COLUMN "purchase_order"."created_by_id" IS '创建人用户ID';
COMMENT ON COLUMN "purchase_order"."status" IS '采购订单状态: PENDING(待审核) / APPROVED(已通过) / REJECTED(已驳回)';
COMMENT ON COLUMN "purchase_order"."audit_comment" IS '审核意见或驳回备注';
COMMENT ON COLUMN "purchase_order"."created_at" IS '订单创建时间';
COMMENT ON COLUMN "purchase_order"."updated_at" IS '订单最后更新时间';
