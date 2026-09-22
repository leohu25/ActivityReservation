import test from "node:test";
import assert from "node:assert/strict";
import {
  parseDirectCreateEmployeeInput,
  parseUpdateEmployeeInput,
  parseTransferDepartmentInput,
  parseTransferPositionInput,
  parseTransferRolesInput,
  suggestLoginAccount,
} from "./schema";

test("directCreateEmployeeSchema: 合法输入通过校验且登录账号必填", () => {
  const input = {
    name: "李四",
    loginAccount: "E0001",
    employeeNo: "EMP-001",
    phone: "13800001111",
    email: "lisi@company.com",
    departmentId: "dept-1",
    positionId: "pos-1",
    avatarUrl: "http://127.0.0.1:9000/bucket/avatar.jpg",
    initialRoleCodes: ["member", "buyer"],
  };
  const parsed = parseDirectCreateEmployeeInput(input);
  assert.equal(parsed.name, "李四");
  assert.equal(parsed.loginAccount, "E0001");
  assert.equal(parsed.phone, "13800001111");
  assert.equal(parsed.email, "lisi@company.com");
  assert.equal(parsed.avatarUrl, "http://127.0.0.1:9000/bucket/avatar.jpg");
  assert.equal(parsed.password, "Admin123456!");
  assert.equal(parsed.initialRoleCodes.length, 2);
});

test("directCreateEmployeeSchema: 邮箱可选，无邮箱可通过", () => {
  const parsed = parseDirectCreateEmployeeInput({
    name: "王强",
    loginAccount: "001",
    departmentId: "dept-1",
    initialRoleCodes: ["member"],
  });
  assert.equal(parsed.email, "");
  assert.equal(parsed.loginAccount, "001");
});

test("directCreateEmployeeSchema: 登录账号缺失拦截", () => {
  assert.throws(
    () =>
      parseDirectCreateEmployeeInput({
        name: "李四",
        loginAccount: "",
        departmentId: "dept-1",
        initialRoleCodes: ["member"],
      }),
    (err: unknown) => {
      assert.ok(err instanceof Error);
      assert.match(err.message, /登录账号/);
      return true;
    },
  );
});

test("directCreateEmployeeSchema: 非法邮箱仍拦截", () => {
  assert.throws(
    () =>
      parseDirectCreateEmployeeInput({
        name: "李四",
        loginAccount: "lisi",
        email: "not-an-email",
        departmentId: "dept-1",
        initialRoleCodes: ["member"],
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
        loginAccount: "E0001",
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

test("updateEmployeeSchema: 合法输入含登录账号与手机号", () => {
  const valid = parseUpdateEmployeeInput({
    name: "李四",
    loginAccount: "E0001",
    phone: "13900002222",
    email: "",
    departmentId: "dept-1",
    roles: ["member"],
  });
  assert.equal(valid.loginAccount, "E0001");
  assert.equal(valid.phone, "13900002222");
  assert.equal(valid.departmentId, "dept-1");

  assert.throws(
    () =>
      parseUpdateEmployeeInput({
        name: "李四",
        loginAccount: "E0001",
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

test("suggestLoginAccount: 工号优先，其次手机号，后端不参与落库择优", () => {
  assert.equal(
    suggestLoginAccount({ employeeNo: "E0001", phone: "13800001111" }),
    "E0001",
  );
  assert.equal(suggestLoginAccount({ employeeNo: "", phone: "13800001111" }), "13800001111");
  assert.equal(suggestLoginAccount({ employeeNo: "  ", phone: "" }), "");
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
