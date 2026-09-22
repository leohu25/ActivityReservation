-- AlterTable
ALTER TABLE "employee_profile" ADD COLUMN     "phone" TEXT;

-- Comments Migration
COMMENT ON COLUMN "employee_profile"."phone" IS '员工手机号';
