-- AddForeignKey
ALTER TABLE "tenant_menu_item" ADD CONSTRAINT "tenant_menu_item_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "tenant_menu_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;