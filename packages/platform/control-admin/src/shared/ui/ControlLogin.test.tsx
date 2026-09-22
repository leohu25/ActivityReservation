import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { renderToString } from "react-dom/server";
import { ThemeProvider } from "@base/ui";
import { ControlLogin } from "./ControlLogin";

describe("ControlLogin 明暗主题与界面渲染契约", () => {
  it("应成功渲染控制平面超管登录卡片，包含主题自适应与切换组件", () => {
    const html = renderToString(
      <ThemeProvider>
        <ControlLogin />
      </ThemeProvider>,
    );

    // 1. 验证标题与超管认证中心标识与中立平台标识
    assert.ok(
      html.includes("控制平面超级管理员登录"),
      "应渲染控制平面超级管理员登录标题",
    );
    assert.ok(
      html.includes("Control Plane Super Admin 认证中心"),
      "应渲染超管认证中心副标题",
    );
    assert.ok(
      html.includes("控制平面平台中枢标识"),
      "应渲染平台中立的中枢图标标识，而非特定企业缩写",
    );
    assert.ok(
      !html.includes(">CR<"),
      "不应包含硬编码的企业特定缩写 CR",
    );

    // 2. 验证暗黑/明亮主题自适应背景容器
    assert.ok(
      html.includes("bg-background") && html.includes("text-foreground"),
      "根容器应使用语义化 bg-background 与 text-foreground 进行明暗主题自适应",
    );

    // 3. 验证卡片语义化背景与边框
    assert.ok(
      html.includes("bg-card") && html.includes("border-border"),
      "登录卡片应使用 bg-card 与 border-border 语义类驱动明暗主题自适应",
    );

    // 4. 验证主题切换器（ThemeToggle）的存在
    assert.ok(
      html.includes("aria-label=\"主题模式切换\"") ||
        html.includes("主题模式切换") ||
        html.includes("data-slot=\"skeleton\""),
      "顶部操作区应包含 ThemeToggle 主题切换挂载点",
    );

    // 5. 验证超管表单字段
    assert.ok(
      html.includes("admin-email"),
      "应包含超管邮箱输入控件",
    );
    assert.ok(
      html.includes("admin-password"),
      "应包含访问密码输入控件",
    );
    assert.ok(
      html.includes("admin@qq.com"),
      "应包含默认超管邮箱提示信息",
    );

    // 6. 验证提交按钮文本与定位
    assert.ok(
      html.includes("进入控制平面大盘"),
      "应渲染进入控制平面大盘操作按钮",
    );
    assert.ok(
      html.includes("首次部署？注册初始超级管理员账号"),
      "应提供注册超管账号模式切换入口",
    );
  });
});
