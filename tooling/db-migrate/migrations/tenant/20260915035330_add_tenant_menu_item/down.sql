-- DropForeignKey
ALTER TABLE "tenant_menu_item" DROP CONSTRAINT "tenant_menu_item_parent_id_fkey";

-- DropTable
DROP TABLE "tenant_menu_item";