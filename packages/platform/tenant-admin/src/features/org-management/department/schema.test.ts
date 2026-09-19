import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createDepartmentSchema,
  updateDepartmentSchema,
  parseCreateDepartmentInput,
  parseUpdateDepartmentInput,
} from "./schema";

describe("department.schema", () => {
  it("合法参数能够通过 createDepartmentSchema 校验", () => {
    const valid = {
      name: "研发中心",
      code: "DEV_CENTER",
      parentId: "dept-1",
      sort: 10,
    };
    const parsed = parseCreateDepartmentInput(valid);
    assert.equal(parsed.name, "研发中心");
    assert.equal(parsed.code, "DEV_CENTER");
    assert.equal(parsed.parentId, "dept-1");
    assert.equal(parsed.sort, 10);
  });

  it("缺省必填项时抛出验证错误", () => {
    assert.throws(() => {
      parseCreateDepartmentInput({ name: "", code: "" });
    });
  });

  it("编码包含非法字符时拦截", () => {
    assert.throws(() => {
      parseCreateDepartmentInput({ name: "研发中心", code: "DEV@123!" });
    });
  });

  it("updateDepartmentSchema 支持局部字段更新", () => {
    const partial = parseUpdateDepartmentInput({ name: "技术中心" });
    assert.equal(partial.name, "技术中心");
    assert.equal(partial.code, undefined);
  });
});
