import test from "node:test";
import assert from "node:assert/strict";
import {
  parseDirectCreateEmployeeInput,
  parseTransferDepartmentInput,
  parseTransferPositionInput,
  parseTransferRolesInput,
} from "./employee.schema";

test("directCreateEmployeeSchema: 合法输入通过校验", () => {
  const input = {
    name: "李四",
    email: "lisi@company.com",
    employeeNo: "EMP-001",
    departmentId: "dept-1",
    positionId: "pos-1",
    initialRoleCodes: ["member", "buyer"],
  };
  const parsed = parseDirectCreateEmployeeInput(input);
  assert.equal(parsed.name, "李四");
  assert.equal(parsed.email, "lisi@company.com");
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
