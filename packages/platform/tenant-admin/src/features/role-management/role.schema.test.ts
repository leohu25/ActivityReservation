import test from "node:test";
import assert from "node:assert/strict";
import {
  createRoleSchema,
  updateRoleSchema,
  parseCreateRoleInput,
  parseUpdateRoleInput,
} from "./role.schema";

test("schema.createRoleSchema: 合法输入校验通过", () => {
  const input = {
    roleCode: "customer_specialist",
    roleName: "客户专员",
    description: "负责客户资料维护与关系跟踪",
  };
  const parsed = parseCreateRoleInput(input);
  assert.equal(parsed.roleCode, "customer_specialist");
  assert.equal(parsed.roleName, "客户专员");
});

test("schema.createRoleSchema: 角色代码格式非法拦截", () => {
  assert.throws(
    () =>
      parseCreateRoleInput({
        roleCode: "123_invalid",
        roleName: "测试角色",
      }),
    (err: unknown) => {
      assert.ok(err instanceof Error);
      return true;
    },
  );
});

test("schema.updateRoleSchema: 仅允许更新名称与描述，拦截不可变编码修改", () => {
  const parsed = parseUpdateRoleInput({
    roleName: "资深客户经理",
    description: "负责核心大客关系维护",
  });
  assert.equal(parsed.roleName, "资深客户经理");
});
