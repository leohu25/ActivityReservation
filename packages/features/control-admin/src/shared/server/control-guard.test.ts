import test from "node:test";
import assert from "node:assert/strict";
import {
  checkIsControlAdmin,
  assertControlAdmin,
  isControlAdminEmail,
} from "./control-guard";

test("控制平面超管鉴权判定与断言守卫", () => {
  assert.equal(isControlAdminEmail("admin@qq.com"), true);
  assert.equal(isControlAdminEmail("user@example.com"), false);
  assert.equal(isControlAdminEmail(null), false);
  assert.equal(isControlAdminEmail(""), false);

  assert.equal(checkIsControlAdmin({ email: "admin@qq.com" }), true);
  assert.equal(checkIsControlAdmin({ email: "normal@tenant.com" }), false);
  assert.equal(checkIsControlAdmin(null), false);

  assert.doesNotThrow(() => {
    assertControlAdmin({ email: "admin@qq.com" });
  });

  assert.throws(
    () => {
      assertControlAdmin({ email: "attacker@malicious.com" });
    },
    {
      name: "Error",
      message: /需要控制平面超级管理员权限/,
    },
  );
});
