-- AlterTable
ALTER TABLE "employee_profile" DROP COLUMN "email",
DROP COLUMN "name",
ADD COLUMN     "email_snapshot" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "name_snapshot" TEXT NOT NULL DEFAULT '';

-- Comments Rollback
COMMENT ON COLUMN "employee_profile"."name_snapshot" IS '员工姓名';
COMMENT ON COLUMN "employee_profile"."email_snapshot" IS '员工工作邮箱';
