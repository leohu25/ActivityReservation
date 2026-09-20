import test from "node:test";
import assert from "node:assert/strict";
import {
  parseDirectCreateEmployeeInput,
  parseUpdateEmployeeInput,
  parseTransferDepartmentInput,
  parseTransferPositionInput,
  parseTransferRolesInput,
} from "./schema";

test("directCreateEmployeeSchema: 合法输入通过校验", () => {
  const input = {
    name: "李四",
    email: "lisi@company.com",
    employeeNo: "EMP-001",
    departmentId: "dept-1",
    positionId: "pos-1",
    avatarUrl: "http://127.0.0.1:9000/bucket/avatar.jpg",
    initialRoleCodes: ["member", "buyer"],
  };
  const parsed = parseDirectCreateEmployeeInput(input);
  assert.equal(parsed.name, "李四");
  assert.equal(parsed.email, "lisi@company.com");
  assert.equal(parsed.avatarUrl, "http://127.0.0.1:9000/bucket/avatar.jpg");
  assert.equal(parsed.password, "123456");
  assert.equal(parsed.initialRoleCodes.length, 2);
});

test("directCreateEmployeeSchema: 必填项缺失拦截", () => {
  assert.throws(
    () =>
      parseDirectCreateEmployeeInput({
        name: "",
        email: "invalid-email",
        initialRoleCodes: [],
      }),
    (err: unknown) => {
      assert.ok(err instanceof Error);
      return true;
    },
  );
});

test("directCreateEmployeeSchema: 归属部门为空拦截", () => {
  assert.throws(
    () =>
      parseDirectCreateEmployeeInput({
        name: "李四",
        email: "lisi@company.com",
        departmentId: "",
        initialRoleCodes: ["member"],
      }),
    (err: unknown) => {
      assert.ok(err instanceof Error);
      assert.match(err.message, /请选择归属部门/);
      return true;
    },
  );
});

test("updateEmployeeSchema: 合法输入通过校验且必填部门", () => {
  const valid = parseUpdateEmployeeInput({
    name: "李四",
    departmentId: "dept-1",
    roles: ["member"],
  });
  assert.equal(valid.departmentId, "dept-1");

  assert.throws(
    () =>
      parseUpdateEmployeeInput({
        name: "李四",
        departmentId: "",
        roles: ["member"],
      }),
    (err: unknown) => {
      assert.ok(err instanceof Error);
      assert.match(err.message, /请选择归属部门/);
      return true;
    },
  );
});

test("transferDepartmentSchema & transferPositionSchema 校验", () => {
  const deptInput = parseTransferDepartmentInput({
    employeeId: "emp-1",
    targetDepartmentId: "dept-2",
  });
  assert.equal(deptInput.targetDepartmentId, "dept-2");

  const posInput = parseTransferPositionInput({
    employeeId: "emp-1",
    targetPositionId: null,
  });
  assert.equal(posInput.targetPositionId, null);
});

test("transferRolesSchema: 拦截空角色数组", () => {
  assert.throws(
    () =>
      parseTransferRolesInput({
        memberId: "mem-1",
        newRoleCodes: [],
      }),
    (err: unknown) => {
      assert.ok(err instanceof Error);
      return true;
    },
  );
});
