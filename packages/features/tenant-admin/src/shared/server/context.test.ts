import test from "node:test";
import assert from "node:assert/strict";
import { createMongoAbility } from "@casl/ability";
import type { AppAbility } from "@base/authorization";
import { assertTenantAdminAbility } from "./tenant-context";
import {
  DepartmentSubject,
  PositionSubject,
  EmployeeSubject,
} from "../../features/org-management/contract";
import { RoleManagementSubject } from "../../features/role-management/contract";
import { CompanyProfileSubject } from "../../features/tenant-settings/contract";

test("assertTenantAdminAbility: 具备权限时正常通过", () => {
  const ability: AppAbility<string, string> = createMongoAbility<
    [string, string]
  >([
    { action: "read", subject: DepartmentSubject },
    { action: "create", subject: DepartmentSubject },
    { action: "update", subject: EmployeeSubject },
  ]);

  assert.doesNotThrow(() => {
    assertTenantAdminAbility(ability, "read", DepartmentSubject);
  });
  assert.doesNotThrow(() => {
    assertTenantAdminAbility(ability, "create", DepartmentSubject);
  });
  assert.doesNotThrow(() => {
    assertTenantAdminAbility(ability, "update", EmployeeSubject);
  });
});

test("assertTenantAdminAbility: 未授权动作或实体时抛出 Forbidden 异常 (Fail-Closed)", () => {
  const ability: AppAbility<string, string> = createMongoAbility<
    [string, string]
  >([{ action: "read", subject: DepartmentSubject }]);

  // 无权创建部门
  assert.throws(
    () => {
      assertTenantAdminAbility(ability, "create", DepartmentSubject);
    },
    (err: unknown) => {
      return (
        err instanceof Error &&
        err.name === "ForbiddenError" &&
        err.message.includes("Department")
      );
    },
  );

  // 无权访问角色配置
  assert.throws(
    () => {
      assertTenantAdminAbility(ability, "update", RoleManagementSubject);
    },
    (err: unknown) => {
      return err instanceof Error && err.name === "ForbiddenError";
    },
  );

  // 无权修改企业资料
  assert.throws(
    () => {
      assertTenantAdminAbility(ability, "update", CompanyProfileSubject);
    },
    (err: unknown) => {
      return err instanceof Error && err.name === "ForbiddenError";
    },
  );

  // 无权删除岗位
  assert.throws(
    () => {
      assertTenantAdminAbility(ability, "delete", PositionSubject);
    },
    (err: unknown) => {
      return err instanceof Error && err.name === "ForbiddenError";
    },
  );
});
