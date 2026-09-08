# 特性背景：SaaS Web 门户与主面板框架 (foundation-web-shell)

## 一、 目标

在底层权限与租户引擎就绪的基础上，搭建起一套完整的、可直接在浏览器中交互的 ERP Web 门户与仪表盘骨架（Web Portal & Dashboard Shell），提供可视化的四层权限演示与操作工作台。

## 二、 范围内能力

1. **认证与租户选择界面**：
   - 登录与注册页面（基于 Better Auth 前端客户端，支持邮箱密码凭据）。
   - 租户（Organization）切换与激活交互。
2. **ERP 统一后台面板骨架 (Dashboard Shell)**：
   - 顶部导航栏（TopHeader）：租户名称显示、租户切换下拉、当前登录用户信息与退出登录。
   - 侧边栏（Sidebar）：支持基于权限展示的高内聚导航菜单。
   - 面包屑与内容区容器。
3. **前端 CASL 权限树注入与三态字段组件**：
   - 服务端向客户端注水当前用户的 CASL 规则（AbilityProvider）。
   - 在 UI 层封装 `<PermissionField>` 组件，根据 `HIDDEN`、`READONLY`、`EDITABLE` 自动隐藏或禁用输入框。
4. **四层权限可视化演练交互面板**：
   - 提供一个高保真工作台页面，直观展示当前登录用户、当前激活租户、角色、数据范围下推效果与字段三态表单交互，让用户能直观在浏览器看到效果。

## 三、 明确不做

- 具体采购业务表的多租户数据库迁移（留待 `foundation-migration`）。
- 真实的采购订单 CRUD 数据库持久化（留待 `procurement-center`）。
