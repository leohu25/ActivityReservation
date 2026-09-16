import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { renderToString } from "react-dom/server";
import { Combobox } from "./Combobox";

describe("Combobox 通用组件测试", () => {
  it("无选中值时：渲染 placeholder", () => {
    const html = renderToString(
      <Combobox
        options={[
          { value: "C001", label: "客户一", description: "编码: C001" },
          { value: "C002", label: "客户二", description: "编码: C002" },
        ]}
        placeholder="请选择客户..."
      />,
    );

    assert.ok(html.includes("请选择客户..."));
    assert.ok(!html.includes("客户一"));
  });

  it("有选中值时：正确渲染 label", () => {
    const html = renderToString(
      <Combobox
        value="C001"
        options={[
          { value: "C001", label: "客户一", description: "编码: C001" },
          { value: "C002", label: "客户二", description: "编码: C002" },
        ]}
      />,
    );

    assert.ok(html.includes("客户一"));
  });
});
