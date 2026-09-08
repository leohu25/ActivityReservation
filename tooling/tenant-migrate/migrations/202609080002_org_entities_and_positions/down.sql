-- 降级回滚脚本：按依赖逆序移除 company_profile, position 与员工/部门新增字段
DROP TABLE IF EXISTS "company_profile";

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'employee_profile_positionId_fkey') THEN
        ALTER TABLE "employee_profile" DROP CONSTRAINT "employee_profile_positionId_fkey";
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'employee_profile_managerEmployeeId_fkey') THEN
        ALTER TABLE "employee_profile" DROP CONSTRAINT "employee_profile_managerEmployeeId_fkey";
    END IF;
END $$;

DROP TABLE IF EXISTS "position";

ALTER TABLE "department"
DROP COLUMN IF EXISTS "leaderMemberId",
DROP COLUMN IF EXISTS "sort",
DROP COLUMN IF EXISTS "status";
