-- AlterTable
ALTER TABLE "tenant_menu_item" DROP COLUMN "external_url",
DROP COLUMN "open_in_new_tab";

-- Comments Rollback
COMMENT ON COLUMN "tenant_menu_item"."item_type" IS '节点类型: GROUP(大菜单/目录分组) | PAGE(具体功能页面)';
