-- AddForeignKey
ALTER TABLE "bom_header" ADD CONSTRAINT "bom_header_output_item_code_fkey" FOREIGN KEY ("output_item_code") REFERENCES "item_master"("item_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bom_header" ADD CONSTRAINT "bom_header_production_line_id_fkey" FOREIGN KEY ("production_line_id") REFERENCES "production_line"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bom_input_item" ADD CONSTRAINT "bom_input_item_bom_process_id_fkey" FOREIGN KEY ("bom_process_id") REFERENCES "bom_process"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bom_output_item" ADD CONSTRAINT "bom_output_item_bom_process_id_fkey" FOREIGN KEY ("bom_process_id") REFERENCES "bom_process"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bom_process" ADD CONSTRAINT "bom_process_bom_id_fkey" FOREIGN KEY ("bom_id") REFERENCES "bom_header"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bom_process" ADD CONSTRAINT "bom_process_process_id_fkey" FOREIGN KEY ("process_id") REFERENCES "process_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bom_process" ADD CONSTRAINT "bom_process_spec_id_fkey" FOREIGN KEY ("spec_id") REFERENCES "process_spec"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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
ALTER TABLE "item_category" ADD CONSTRAINT "item_category_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "item_category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_master" ADD CONSTRAINT "item_master_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "item_category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_master" ADD CONSTRAINT "item_master_variety_id_fkey" FOREIGN KEY ("variety_id") REFERENCES "item_variety"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_master" ADD CONSTRAINT "item_master_grade_id_fkey" FOREIGN KEY ("grade_id") REFERENCES "item_grade"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "process_spec" ADD CONSTRAINT "process_spec_process_id_fkey" FOREIGN KEY ("process_id") REFERENCES "process_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order" ADD CONSTRAINT "purchase_order_dept_id_fkey" FOREIGN KEY ("dept_id") REFERENCES "department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_order_fee" ADD CONSTRAINT "sales_order_fee_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "sales_order"("order_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_order_item" ADD CONSTRAINT "sales_order_item_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "sales_order"("order_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unit_conversion" ADD CONSTRAINT "unit_conversion_from_unit_id_fkey" FOREIGN KEY ("from_unit_id") REFERENCES "unit_of_measure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unit_conversion" ADD CONSTRAINT "unit_conversion_to_unit_id_fkey" FOREIGN KEY ("to_unit_id") REFERENCES "unit_of_measure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unit_conversion" ADD CONSTRAINT "unit_conversion_item_code_fkey" FOREIGN KEY ("item_code") REFERENCES "item_master"("item_code") ON DELETE SET NULL ON UPDATE CASCADE;

-- Comments Rollback
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
COMMENT ON COLUMN "customer"."created_by_id" IS '创建人用户ID';
COMMENT ON COLUMN "customer"."dept_id" IS '归属部门ID (用于数据范围判定)';
COMMENT ON COLUMN "customer"."updated_by_id" IS '最后更新人用户ID';
COMMENT ON COLUMN "customer"."is_deleted" IS '软删除标记';
COMMENT ON COLUMN "customer"."deleted_at" IS '软删除时间';
COMMENT ON COLUMN "customer"."deleted_by_id" IS '软删除操作人用户ID';
COMMENT ON COLUMN "customer"."created_at" IS '创建时间';
COMMENT ON COLUMN "customer"."updated_at" IS '更新时间';
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
COMMENT ON COLUMN "customer_store"."created_by_id" IS '创建人用户ID';
COMMENT ON COLUMN "customer_store"."dept_id" IS '归属部门ID';
COMMENT ON COLUMN "customer_store"."updated_by_id" IS '最后更新人用户ID';
COMMENT ON COLUMN "customer_store"."is_deleted" IS '软删除标记';
COMMENT ON COLUMN "customer_store"."deleted_at" IS '软删除时间';
COMMENT ON COLUMN "customer_store"."deleted_by_id" IS '软删除操作人用户ID';
COMMENT ON COLUMN "customer_store"."created_at" IS '创建时间';
COMMENT ON COLUMN "customer_store"."updated_at" IS '更新时间';
