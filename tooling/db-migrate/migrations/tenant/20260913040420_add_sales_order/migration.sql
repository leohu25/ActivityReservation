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

-- AddForeignKey
ALTER TABLE "sales_order_fee" ADD CONSTRAINT "sales_order_fee_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "sales_order"("order_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_order_item" ADD CONSTRAINT "sales_order_item_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "sales_order"("order_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Comments Migration
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
