import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToString } from "react-dom/server";
import { ENTERPRISE_ICONS, ICON_MAP } from "./icon-catalog";
import { DynamicNavIcon } from "./DynamicNavIcon";
import { IconPicker } from "./IconPicker";

test("icon-catalog 包含企业精选分类且映射完备", () => {
  assert.ok(ENTERPRISE_ICONS.length >= 40);
  assert.ok(ICON_MAP.Settings !== undefined);
  assert.ok(ICON_MAP.Folder !== undefined);
  assert.ok(ICON_MAP.ExternalLink !== undefined);
});

test("DynamicNavIcon 渲染正常且支持安全回退", () => {
  // 渲染已注册图标
  const htmlSettings = renderToString(<DynamicNavIcon name="Settings" />);
  assert.ok(htmlSettings.includes("svg"));

  // 渲染未知图标时根据 fallbackType 回退
  const htmlGroup = renderToString(
    <DynamicNavIcon name="NonExistent" fallbackType="group" />,
  );
  assert.ok(htmlGroup.includes("svg"));

  const htmlExternal = renderToString(
    <DynamicNavIcon name={null} fallbackType="external" />,
  );
  assert.ok(htmlExternal.includes("svg"));
});

test("IconPicker 基础渲染无异常", () => {
  const html = renderToString(
    <IconPicker value="Settings" onChange={() => {}} />,
  );
  assert.ok(html.includes("Settings"));
});
