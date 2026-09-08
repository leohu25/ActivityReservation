import test from "node:test";
import assert from "node:assert/strict";
import {
  collectDepartmentTreeIds,
  resolveEmployeeTopology,
  type DepartmentTopologyReader,
} from "./department-topology";

test("collectDepartmentTreeIds 能够正确递归展开多级子部门 ID", () => {
  const departments = [
    { id: "dept_root", parentId: null },
    { id: "dept_sales", parentId: "dept_root" },
    { id: "dept_sales_east", parentId: "dept_sales" },
    { id: "dept_sales_east_hangzhou", parentId: "dept_sales_east" },
    { id: "dept_sales_west", parentId: "dept_sales" },
    { id: "dept_finance", parentId: "dept_root" },
  ];

  const eastTree = collectDepartmentTreeIds(departments, "dept_sales_east");
  assert.deepEqual(
    eastTree.sort(),
    ["dept_sales_east", "dept_sales_east_hangzhou"].sort(),
  );

  const salesTree = collectDepartmentTreeIds(departments, "dept_sales");
  assert.deepEqual(
    salesTree.sort(),
    [
      "dept_sales",
      "dept_sales_east",
      "dept_sales_east_hangzhou",
      "dept_sales_west",
    ].sort(),
  );
});

test("collectDepartmentTreeIds 在出现循环父子引用时安全终止且不产生死循环", () => {
  const departmentsWithCycle = [
    { id: "dept_a", parentId: "dept_b" },
    { id: "dept_b", parentId: "dept_a" },
  ];

  const result = collectDepartmentTreeIds(departmentsWithCycle, "dept_a");
  assert.deepEqual(result.sort(), ["dept_a", "dept_b"].sort());
});

test("collectDepartmentTreeIds 在根部门不在列表中时安全退化为包含自身", () => {
  const departments = [{ id: "dept_other", parentId: null }];
  const result = collectDepartmentTreeIds(departments, "dept_unknown");
  assert.deepEqual(result, ["dept_unknown"]);
});

test("resolveEmployeeTopology 在档案完备时正确聚合用户与部门树拓扑", async () => {
  const mockReader: DepartmentTopologyReader = {
    async findEmployeeProfile(memberId: string) {
      if (memberId === "member_001") {
        return {
          id: "emp_001",
          memberId: "member_001",
          departmentId: "dept_sales_east",
          employeeNo: "CR-001",
          jobTitle: "华东销售经理",
          status: "ACTIVE",
        };
      }
      return null;
    },
    async findAllDepartments() {
      return [
        { id: "dept_sales", parentId: null },
        { id: "dept_sales_east", parentId: "dept_sales" },
        { id: "dept_sales_east_hz", parentId: "dept_sales_east" },
      ];
    },
  };

  const topology = await resolveEmployeeTopology(mockReader, {
    userId: "user_001",
    memberId: "member_001",
  });

  assert.equal(topology.userId, "user_001");
  assert.equal(topology.departmentId, "dept_sales_east");
  assert.equal(topology.employeeNo, "CR-001");
  assert.equal(topology.jobTitle, "华东销售经理");
  assert.deepEqual(
    [...topology.departmentTreeIds].sort(),
    ["dept_sales_east", "dept_sales_east_hz"].sort(),
  );
});

test("resolveEmployeeTopology 在员工不存在、离职或未分配部门时执行 Fail-Closed", async () => {
  const mockReader: DepartmentTopologyReader = {
    async findEmployeeProfile(memberId: string) {
      if (memberId === "member_inactive") {
        return {
          id: "emp_002",
          memberId: "member_inactive",
          departmentId: "dept_sales",
          employeeNo: "CR-002",
          jobTitle: "前销售",
          status: "TERMINATED",
        };
      }
      if (memberId === "member_suspended") {
        return {
          id: "emp_suspended",
          memberId: "member_suspended",
          departmentId: "dept_sales",
          employeeNo: "CR-SUSPENDED",
          jobTitle: "暂停员工",
          status: "SUSPENDED",
        };
      }
      if (memberId === "member_no_dept") {
        return {
          id: "emp_003",
          memberId: "member_no_dept",
          departmentId: null,
          employeeNo: "CR-003",
          jobTitle: "待定",
          status: "ACTIVE",
        };
      }
      return null;
    },
    async findAllDepartments() {
      return [{ id: "dept_sales", parentId: null }];
    },
  };

  // 1. 档案不存在
  const notFound = await resolveEmployeeTopology(mockReader, {
    userId: "user_404",
    memberId: "member_404",
  });
  assert.equal(notFound.departmentId, null);
  assert.deepEqual(notFound.departmentTreeIds, []);

  // 2. 档案为离职态 (TERMINATED)
  const inactive = await resolveEmployeeTopology(mockReader, {
    userId: "user_inactive",
    memberId: "member_inactive",
  });
  assert.equal(inactive.departmentId, null);
  assert.deepEqual(inactive.departmentTreeIds, []);

  // 3. 档案为停用态 (SUSPENDED)
  const suspended = await resolveEmployeeTopology(mockReader, {
    userId: "user_suspended",
    memberId: "member_suspended",
  });
  assert.equal(suspended.departmentId, null);
  assert.deepEqual(suspended.departmentTreeIds, []);

  // 4. 档案未分配部门
  const noDept = await resolveEmployeeTopology(mockReader, {
    userId: "user_no_dept",
    memberId: "member_no_dept",
  });
  assert.equal(noDept.departmentId, null);
  assert.deepEqual(noDept.departmentTreeIds, []);
});
