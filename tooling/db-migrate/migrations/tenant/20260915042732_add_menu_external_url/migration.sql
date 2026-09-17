-- AlterTable
ALTER TABLE "tenant_menu_item" ADD COLUMN     "external_url" TEXT,
ADD COLUMN     "open_in_new_tab" BOOLEAN NOT NULL DEFAULT false;

-- Comments Migration
COMMENT ON COLUMN "tenant_menu_item"."item_type" IS '节点类型: GROUP(大菜单/目录分组) | PAGE(具体功能页面) | LINK(外部链接)';
COMMENT ON COLUMN "tenant_menu_item"."external_url" IS '外部跳转 URL (若 itemType="LINK"，如 "https://bi.company.com")';
COMMENT ON COLUMN "tenant_menu_item"."open_in_new_tab" IS '是否在新标签页打开';
