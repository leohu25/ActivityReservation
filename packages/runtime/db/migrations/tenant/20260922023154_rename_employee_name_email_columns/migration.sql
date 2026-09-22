-- AlterTable
ALTER TABLE "employee_profile" RENAME COLUMN "email_snapshot" TO "email";
ALTER TABLE "employee_profile" RENAME COLUMN "name_snapshot" TO "name";

-- Comments Migration
COMMENT ON COLUMN "employee_profile"."name" IS '员工姓名';
COMMENT ON COLUMN "employee_profile"."email" IS '员工工作邮箱';
