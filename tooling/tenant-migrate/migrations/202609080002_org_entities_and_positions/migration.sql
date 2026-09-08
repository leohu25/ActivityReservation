-- 租户物理数据库 202609080002 迁移：补齐岗位、企业扩展档案，扩展部门与员工档案

-- 1. 扩展部门表字段 (leaderMemberId, sort, status)
ALTER TABLE "department"
ADD COLUMN IF NOT EXISTS "leaderMemberId" TEXT,
ADD COLUMN IF NOT EXISTS "sort" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'ACTIVE';

CREATE INDEX IF NOT EXISTS "department_status_idx" ON "department"("status");

-- 2. 创建岗位表 (Position)
CREATE TABLE IF NOT EXISTS "position" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "position_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "position_code_key" ON "position"("code");
CREATE INDEX IF NOT EXISTS "position_status_idx" ON "position"("status");

-- 3. 增强员工档案表 (EmployeeProfile: nullable memberId, userId, invitationId, positionId, managerEmployeeId, snapshots)
-- 若 employee_profile 已经存在，更新或补齐字段
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employee_profile') THEN
        -- 修改 memberId 为可空 (若当前非空)
        ALTER TABLE "employee_profile" ALTER COLUMN "memberId" DROP NOT NULL;

        -- 增加新列
        ALTER TABLE "employee_profile"
        ADD COLUMN IF NOT EXISTS "userId" TEXT,
        ADD COLUMN IF NOT EXISTS "invitationId" TEXT,
        ADD COLUMN IF NOT EXISTS "positionId" TEXT,
        ADD COLUMN IF NOT EXISTS "managerEmployeeId" TEXT,
        ADD COLUMN IF NOT EXISTS "nameSnapshot" TEXT NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS "emailSnapshot" TEXT NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS "joinedAt" TIMESTAMP(3),
        ADD COLUMN IF NOT EXISTS "terminatedAt" TIMESTAMP(3);
    ELSE
        CREATE TABLE "employee_profile" (
            "id" TEXT NOT NULL,
            "memberId" TEXT,
            "userId" TEXT,
            "invitationId" TEXT,
            "employeeNo" TEXT,
            "departmentId" TEXT,
            "positionId" TEXT,
            "managerEmployeeId" TEXT,
            "nameSnapshot" TEXT NOT NULL DEFAULT '',
            "emailSnapshot" TEXT NOT NULL DEFAULT '',
            "jobTitle" TEXT,
            "status" TEXT NOT NULL DEFAULT 'ACTIVE',
            "joinedAt" TIMESTAMP(3),
            "terminatedAt" TIMESTAMP(3),
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

            CONSTRAINT "employee_profile_pkey" PRIMARY KEY ("id")
        );
        CREATE UNIQUE INDEX "employee_profile_memberId_key" ON "employee_profile"("memberId");
        CREATE UNIQUE INDEX "employee_profile_employeeNo_key" ON "employee_profile"("employeeNo");
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS "employee_profile_departmentId_idx" ON "employee_profile"("departmentId");
CREATE INDEX IF NOT EXISTS "employee_profile_positionId_idx" ON "employee_profile"("positionId");
CREATE INDEX IF NOT EXISTS "employee_profile_managerEmployeeId_idx" ON "employee_profile"("managerEmployeeId");
CREATE INDEX IF NOT EXISTS "employee_profile_memberId_idx" ON "employee_profile"("memberId");
CREATE INDEX IF NOT EXISTS "employee_profile_status_idx" ON "employee_profile"("status");

-- 建立员工外键约束 (department, position, manager)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'employee_profile_departmentId_fkey') THEN
        ALTER TABLE "employee_profile"
        ADD CONSTRAINT "employee_profile_departmentId_fkey"
        FOREIGN KEY ("departmentId") REFERENCES "department"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'employee_profile_positionId_fkey') THEN
        ALTER TABLE "employee_profile"
        ADD CONSTRAINT "employee_profile_positionId_fkey"
        FOREIGN KEY ("positionId") REFERENCES "position"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'employee_profile_managerEmployeeId_fkey') THEN
        ALTER TABLE "employee_profile"
        ADD CONSTRAINT "employee_profile_managerEmployeeId_fkey"
        FOREIGN KEY ("managerEmployeeId") REFERENCES "employee_profile"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- 4. 创建租户企业私有资料表 (CompanyProfile)
CREATE TABLE IF NOT EXISTS "company_profile" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "shortName" TEXT,
    "creditCode" TEXT,
    "legalPerson" TEXT,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "address" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Shanghai',
    "currency" TEXT NOT NULL DEFAULT 'CNY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_profile_pkey" PRIMARY KEY ("id")
);
