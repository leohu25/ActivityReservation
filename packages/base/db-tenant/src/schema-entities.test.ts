import test from "node:test";
import assert from "node:assert/strict";
import type { TenantPrisma } from "./index";
import type { ControlPrisma } from "@base/db-control";

test("Tenant DB Schema 契约支持 Position、CompanyProfile 及增强版 EmployeeProfile 与 Department", () => {
  // 1. 验证 DepartmentCreateInput 包含 leaderMemberId, sort, status
  const deptInput: TenantPrisma.DepartmentCreateInput = {
    id: "dept_test_01",
    name: "总经办",
    code: "DEPT_GM",
    leaderMemberId: "mem_leader_01",
    sort: 1,
    status: "ACTIVE",
  };
  assert.equal(deptInput.leaderMemberId, "mem_leader_01");
  assert.equal(deptInput.sort, 1);
  assert.equal(deptInput.status, "ACTIVE");

  // 2. 验证 PositionCreateInput 包含编码、排序与状态
  const posInput: TenantPrisma.PositionCreateInput = {
    id: "pos_test_01",
    name: "技术主管",
    code: "pos_dept_mgr",
    description: "负责部门业务统筹",
    sort: 10,
    status: "ACTIVE",
  };
  assert.equal(posInput.name, "技术主管");
  assert.equal(posInput.code, "pos_dept_mgr");
  assert.equal(posInput.sort, 10);

  // 3. 验证 EmployeeProfileCreateInput 支持 memberId 为 null（先建档未激活态）
  const draftEmployeeInput: TenantPrisma.EmployeeProfileCreateInput = {
    id: "emp_draft_01",
    memberId: null, // 关键契约：nullable
    userId: null,
    invitationId: "inv_123",
    employeeNo: "E1001",
    name: "张三",
    email: "zhangsan@example.com",
    jobTitle: "资深采购专员",
    status: "ACTIVE",
    joinedAt: new Date("2026-09-01"),
    terminatedAt: null,
  };
  assert.equal(draftEmployeeInput.memberId, null);
  assert.equal(draftEmployeeInput.name, "张三");
  assert.equal(draftEmployeeInput.email, "zhangsan@example.com");

  // 4. 验证 CompanyProfileCreateInput 完整包含企业私有资料
  const companyInput: TenantPrisma.CompanyProfileCreateInput = {
    id: "comp_01",
    companyName: "数智数字科技有限公司",
    shortName: "数智科技",
    creditCode: "91330100MA2XXXXX1",
    legalPerson: "王总",
    contactPhone: "0571-88888888",
    contactEmail: "contact@example.com",
    address: "浙江省杭州市高新区科技大厦",
    timezone: "Asia/Shanghai",
    currency: "CNY",
  };
  assert.equal(companyInput.companyName, "数智数字科技有限公司");
  assert.equal(companyInput.currency, "CNY");
});

test("Control DB Schema 契约支持 Organization.authorizationVersion", () => {
  const orgInput: ControlPrisma.OrganizationCreateInput = {
    id: "org_test_01",
    name: "测试企业",
    slug: "test-corp",
    authorizationVersion: 2,
  };
  assert.equal(orgInput.authorizationVersion, 2);
});
