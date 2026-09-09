-- 自动生成的降级回滚脚本: 20260909155730_add_customer
-- 生成时间: 2026-09-09T07:57:32.217Z

-- DropForeignKey
ALTER TABLE "public"."customer_category" DROP CONSTRAINT "customer_category_parent_code_fkey";

-- DropForeignKey
ALTER TABLE "public"."customer" DROP CONSTRAINT "customer_category_code_fkey";

-- DropForeignKey
ALTER TABLE "public"."customer_tag_assignment" DROP CONSTRAINT "customer_tag_assignment_customer_code_fkey";

-- DropForeignKey
ALTER TABLE "public"."customer_tag_assignment" DROP CONSTRAINT "customer_tag_assignment_tag_code_fkey";

-- DropForeignKey
ALTER TABLE "public"."customer_store" DROP CONSTRAINT "customer_store_customer_code_fkey";

-- DropForeignKey
ALTER TABLE "public"."customer_quote" DROP CONSTRAINT "customer_quote_customer_code_fkey";

-- DropForeignKey
ALTER TABLE "public"."customer_quote" DROP CONSTRAINT "customer_quote_store_code_fkey";

-- DropForeignKey
ALTER TABLE "public"."customer_quote_item" DROP CONSTRAINT "customer_quote_item_quote_id_fkey";

-- DropTable
DROP TABLE "public"."customer_category";

-- DropTable
DROP TABLE "public"."customer_tag";

-- DropTable
DROP TABLE "public"."customer";

-- DropTable
DROP TABLE "public"."customer_tag_assignment";

-- DropTable
DROP TABLE "public"."customer_store";

-- DropTable
DROP TABLE "public"."customer_quote";

-- DropTable
DROP TABLE "public"."customer_quote_item";