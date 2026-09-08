-- 租户独立物理数据库基线迁移：部门拓扑与采购订单核心表结构

-- 1. 创建部门表 (用于部门数据范围 DEPT / DEPT_TREE 判定)
CREATE TABLE IF NOT EXISTS "department" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "department_pkey" PRIMARY KEY ("id")
);

-- 2. 创建采购订单业务切片表 (核心业务实体与 CASL 授权实体)
CREATE TABLE IF NOT EXISTS "purchase_order" (
    "id" TEXT NOT NULL,
    "orderNo" TEXT NOT NULL,
    "supplierName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "costPrice" DECIMAL(12,2) NOT NULL,
    "deptId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "auditComment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_order_pkey" PRIMARY KEY ("id")
);

-- 3. 创建部门编码唯一索引
CREATE UNIQUE INDEX IF NOT EXISTS "department_code_key" ON "department"("code");

-- 4. 创建订单业务索引
CREATE UNIQUE INDEX IF NOT EXISTS "purchase_order_orderNo_key" ON "purchase_order"("orderNo");
CREATE INDEX IF NOT EXISTS "purchase_order_deptId_idx" ON "purchase_order"("deptId");
CREATE INDEX IF NOT EXISTS "purchase_order_createdById_idx" ON "purchase_order"("createdById");
CREATE INDEX IF NOT EXISTS "purchase_order_status_idx" ON "purchase_order"("status");

-- 5. 建立部门外键依赖关系
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'purchase_order_deptId_fkey'
    ) THEN
        ALTER TABLE "purchase_order"
        ADD CONSTRAINT "purchase_order_deptId_fkey"
        FOREIGN KEY ("deptId") REFERENCES "department"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;
