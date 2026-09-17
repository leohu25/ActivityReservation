-- CreateTable
CREATE TABLE "tenant_menu_item" (
    "id" TEXT NOT NULL,
    "parent_id" TEXT,
    "item_type" TEXT NOT NULL DEFAULT 'PAGE',
    "page_key" TEXT,
    "custom_label" TEXT,
    "custom_icon" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "created_by_id" TEXT NOT NULL DEFAULT 'system',
    "dept_id" TEXT,
    "updated_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "deleted_by_id" TEXT,

    CONSTRAINT "tenant_menu_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tenant_menu_item_parent_id_sort_order_idx" ON "tenant_menu_item"("parent_id", "sort_order");

-- CreateIndex
CREATE INDEX "tenant_menu_item_is_deleted_idx" ON "tenant_menu_item"("is_deleted");

-- AddForeignKey
ALTER TABLE "tenant_menu_item" ADD CONSTRAINT "tenant_menu_item_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "tenant_menu_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Comments Migration
COMMENT ON TABLE "tenant_menu_item" IS '租户动态导航菜单配置模型 (支持现场层级调整、自定义别名与跨切片灵活编排)';
COMMENT ON COLUMN "tenant_menu_item"."id" IS '节点主键ID';
COMMENT ON COLUMN "tenant_menu_item"."parent_id" IS '父节点ID (空表示顶级大菜单/顶级单页)';
COMMENT ON COLUMN "tenant_menu_item"."item_type" IS '节点类型: GROUP(大菜单/目录分组) | PAGE(具体功能页面)';
COMMENT ON COLUMN "tenant_menu_item"."page_key" IS '关联的标准页面键名 (若 itemType="PAGE"，对应 StandardPageDescriptor.pageKey)';
COMMENT ON COLUMN "tenant_menu_item"."custom_label" IS '自定义显示别名 (现场实施重命名；空则使用页面契约 defaultLabel)';
COMMENT ON COLUMN "tenant_menu_item"."custom_icon" IS '自定义图标名称 (空则使用页面契约 defaultIcon)';
COMMENT ON COLUMN "tenant_menu_item"."sort_order" IS '排序权重 (升序排列)';
COMMENT ON COLUMN "tenant_menu_item"."is_visible" IS '是否可见';
COMMENT ON COLUMN "tenant_menu_item"."created_by_id" IS '创建人 ID';
COMMENT ON COLUMN "tenant_menu_item"."dept_id" IS '归属部门 ID';
COMMENT ON COLUMN "tenant_menu_item"."updated_by_id" IS '更新人 ID';
COMMENT ON COLUMN "tenant_menu_item"."created_at" IS '创建时间';
COMMENT ON COLUMN "tenant_menu_item"."updated_at" IS '更新时间';
COMMENT ON COLUMN "tenant_menu_item"."is_deleted" IS '软删除标记';
COMMENT ON COLUMN "tenant_menu_item"."deleted_at" IS '软删除时间';
COMMENT ON COLUMN "tenant_menu_item"."deleted_by_id" IS '软删除人 ID';
