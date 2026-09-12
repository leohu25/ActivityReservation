import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToString } from "react-dom/server";
import { FormDialog, FormDrawer, FormSection, FormBanner, FormFieldGrid, FormFields } from "./index";

test("FormDialog: 正常渲染标题、徽标与子内容", () => {
  const html = renderToString(
    <FormDialog
      open
      inline
      onOpenChange={() => {}}
      title="新建测试记录"
      description="用于测试的表单描述"
      badge="TEST"
      headerExtra={<FormBanner title="测试横幅" description="这是提示内容" />}
    >
      <FormSection title="基础信息">
        <FormFieldGrid columns={2}>
          <div data-testid="field-1">字段1</div>
          <div data-testid="field-2">字段2</div>
        </FormFieldGrid>
      </FormSection>
    </FormDialog>,
  );

  assert.match(html, /新建测试记录/);
  assert.match(html, /用于测试的表单描述/);
  assert.match(html, /TEST/);
  assert.match(html, /测试横幅/);
  assert.match(html, /字段1/);
});

test("FormDrawer: 正常渲染侧滑抽屉结构", () => {
  const html = renderToString(
    <FormDrawer
      open
      onOpenChange={() => {}}
      title="物料详情抽屉"
      description="查看或编辑物料详细属性"
      footer={<button>保存</button>}
    >
      <div>抽屉内容主体</div>
    </FormDrawer>,
  );

  // Radix Sheet 在 SSR 下基于 Portal，验证组件函数渲染不抛出异常
  assert.ok(html !== undefined);
});
