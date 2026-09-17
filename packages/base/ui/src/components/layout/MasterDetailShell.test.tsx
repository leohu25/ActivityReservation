import assert from "node:assert/strict";
import test from "node:test";
import { renderToString } from "react-dom/server";
import { MasterDetailShell } from "./MasterDetailShell";

test("MasterDetailShell 渲染标准主从二栏结构与头部/底部插槽", () => {
  const html = renderToString(
    <MasterDetailShell
      master={<div id="master-tree">菜单树列表</div>}
      detail={<div id="detail-view">属性配置面板</div>}
      masterHeader={<span>主栏标题</span>}
      detailHeader={<span>详情标题</span>}
      detailFooter={<button type="button">保存</button>}
      masterWidth="w-72"
    />,
  );

  assert.ok(html.includes("master-tree"), "应包含 master 节点内容");
  assert.ok(html.includes("detail-view"), "应包含 detail 节点内容");
  assert.ok(html.includes("主栏标题"), "应正确挂载 masterHeader 插槽");
  assert.ok(html.includes("详情标题"), "应正确挂载 detailHeader 插槽");
  assert.ok(html.includes("保存"), "应正确挂载 detailFooter 插槽");
  assert.ok(html.includes("w-72"), "应正确注入 masterWidth 样式类");
});

test("MasterDetailShell 在 hasSelected=false 时正确渲染 emptyDetail 占位", () => {
  const html = renderToString(
    <MasterDetailShell
      master={<div>组织树</div>}
      detail={<div>详情信息</div>}
      emptyDetail={<div id="empty-placeholder">请从左侧选择一项</div>}
      hasSelected={false}
    />,
  );

  assert.ok(
    html.includes("empty-placeholder"),
    "当未选中时应展示 emptyDetail 占位内容",
  );
  assert.ok(!html.includes("详情信息"), "当未选中时严禁展示 detail 正常内容");
});
