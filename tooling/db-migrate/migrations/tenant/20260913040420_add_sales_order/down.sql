-- DropForeignKey
ALTER TABLE "sales_order_fee" DROP CONSTRAINT "sales_order_fee_order_id_fkey";

-- DropForeignKey
ALTER TABLE "sales_order_item" DROP CONSTRAINT "sales_order_item_order_id_fkey";

-- DropTable
DROP TABLE "sales_order";

-- DropTable
DROP TABLE "sales_order_fee";

-- DropTable
DROP TABLE "sales_order_item";