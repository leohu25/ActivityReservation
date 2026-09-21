-- CreateTable
CREATE TABLE "tenant_dict_item" (
    "id" VARCHAR(60) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "status" VARCHAR(10) NOT NULL DEFAULT 'ACTIVE',
    "sort" INTEGER NOT NULL DEFAULT 0,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "remark" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_dict_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tenant_dict_item_type_status_idx" ON "tenant_dict_item"("type", "status");

-- CreateIndex
CREATE INDEX "tenant_dict_item_status_idx" ON "tenant_dict_item"("status");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_dict_item_type_code_key" ON "tenant_dict_item"("type", "code");

-- Comments Migration
COMMENT ON TABLE "tenant_dict_item" IS '租户业务基础档案数据字典项表 (租户全域共享配置字典，通过 status 启停用)';
COMMENT ON COLUMN "tenant_dict_item"."id" IS '字典项主键ID (UUID/CUID)';
COMMENT ON COLUMN "tenant_dict_item"."type" IS '字典类型编码 (as const 枚举分类，例如 CUSTOMER_LEVEL)';
COMMENT ON COLUMN "tenant_dict_item"."code" IS '字典项业务编码 (同一 type 下唯一)';
COMMENT ON COLUMN "tenant_dict_item"."name" IS '字典项显示名称';
COMMENT ON COLUMN "tenant_dict_item"."status" IS '状态：ACTIVE(启用) / DISABLED(停用)';
COMMENT ON COLUMN "tenant_dict_item"."sort" IS '显示排序权重 (数字越小越靠前)';
COMMENT ON COLUMN "tenant_dict_item"."is_default" IS '是否默认选中项';
COMMENT ON COLUMN "tenant_dict_item"."remark" IS '备注说明';
COMMENT ON COLUMN "tenant_dict_item"."created_at" IS '创建时间';
COMMENT ON COLUMN "tenant_dict_item"."updated_at" IS '更新时间';
