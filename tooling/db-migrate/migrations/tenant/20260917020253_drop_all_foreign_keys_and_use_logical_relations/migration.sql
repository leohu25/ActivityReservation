-- DropForeignKey
ALTER TABLE "bom_header" DROP CONSTRAINT "bom_header_output_item_code_fkey";

-- DropForeignKey
ALTER TABLE "bom_header" DROP CONSTRAINT "bom_header_production_line_id_fkey";

-- DropForeignKey
ALTER TABLE "bom_input_item" DROP CONSTRAINT "bom_input_item_bom_process_id_fkey";

-- DropForeignKey
ALTER TABLE "bom_output_item" DROP CONSTRAINT "bom_output_item_bom_process_id_fkey";

-- DropForeignKey
ALTER TABLE "bom_process" DROP CONSTRAINT "bom_process_bom_id_fkey";

-- DropForeignKey
ALTER TABLE "bom_process" DROP CONSTRAINT "bom_process_process_id_fkey";

-- DropForeignKey
ALTER TABLE "bom_process" DROP CONSTRAINT "bom_process_spec_id_fkey";

-- DropForeignKey
ALTER TABLE "customer" DROP CONSTRAINT "customer_category_code_fkey";

-- DropForeignKey
ALTER TABLE "customer_category" DROP CONSTRAINT "customer_category_parent_code_fkey";

-- DropForeignKey
ALTER TABLE "customer_quote" DROP CONSTRAINT "customer_quote_customer_code_fkey";

-- DropForeignKey
ALTER TABLE "customer_quote" DROP CONSTRAINT "customer_quote_store_code_fkey";

-- DropForeignKey
ALTER TABLE "customer_quote_item" DROP CONSTRAINT "customer_quote_item_quote_id_fkey";

-- DropForeignKey
ALTER TABLE "customer_store" DROP CONSTRAINT "customer_store_customer_code_fkey";

-- DropForeignKey
ALTER TABLE "customer_tag_assignment" DROP CONSTRAINT "customer_tag_assignment_customer_code_fkey";

-- DropForeignKey
ALTER TABLE "customer_tag_assignment" DROP CONSTRAINT "customer_tag_assignment_tag_code_fkey";

-- DropForeignKey
ALTER TABLE "employee_profile" DROP CONSTRAINT "employee_profile_department_id_fkey";

-- DropForeignKey
ALTER TABLE "employee_profile" DROP CONSTRAINT "employee_profile_position_id_fkey";

-- DropForeignKey
ALTER TABLE "employee_profile" DROP CONSTRAINT "employee_profile_manager_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "item_category" DROP CONSTRAINT "item_category_parent_id_fkey";

-- DropForeignKey
ALTER TABLE "item_master" DROP CONSTRAINT "item_master_category_id_fkey";

-- DropForeignKey
ALTER TABLE "item_master" DROP CONSTRAINT "item_master_variety_id_fkey";

-- DropForeignKey
ALTER TABLE "item_master" DROP CONSTRAINT "item_master_grade_id_fkey";

-- DropForeignKey
ALTER TABLE "process_spec" DROP CONSTRAINT "process_spec_process_id_fkey";

-- DropForeignKey
ALTER TABLE "purchase_order" DROP CONSTRAINT "purchase_order_dept_id_fkey";

-- DropForeignKey
ALTER TABLE "sales_order_fee" DROP CONSTRAINT "sales_order_fee_order_id_fkey";

-- DropForeignKey
ALTER TABLE "sales_order_item" DROP CONSTRAINT "sales_order_item_order_id_fkey";

-- DropForeignKey
ALTER TABLE "unit_conversion" DROP CONSTRAINT "unit_conversion_from_unit_id_fkey";

-- DropForeignKey
ALTER TABLE "unit_conversion" DROP CONSTRAINT "unit_conversion_to_unit_id_fkey";

-- DropForeignKey
ALTER TABLE "unit_conversion" DROP CONSTRAINT "unit_conversion_item_code_fkey";