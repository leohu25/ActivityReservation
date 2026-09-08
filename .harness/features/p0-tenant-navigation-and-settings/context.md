# 特性背景：【P0】租户后台多级导航与企业/基础/安全设置中心 (p0-tenant-navigation-and-settings)

## 一、 目标与背景

严格遵循《SaaS 租户后台产品结构与组织权限模型定义》第 40、48 节规范：
在租户端（`apps/tenant`）实现完整、专业、现代化的左侧导航目录树，并落地企业设置三大核心页面（企业信息、基础设置、安全设置）。

必须彻底落实第 48 节推荐的导航架构：

```text
首页 / 工作台 (/workbench)

业务模块
└── 采购订单中心 (/procurement/orders)

系统管理
├── 组织架构
│   ├── 员工管理 (/organization/employees)
│   ├── 部门管理 (/organization/departments)
│   └── 岗位管理 (/organization/positions)
├── 权限管理
│   ├── 角色管理 (/settings/roles)
│   └── 权限配置 (/settings/roles)
├── 企业设置
│   ├── 企业信息 (/settings/company)
│   ├── 基础设置 (/settings/general)
│   └── 安全设置 (/settings/security)
└── 审计日志 (占位/第二梯队启用)
    ├── 操作日志 (/audit/operations)
    ├── 登录日志 (/audit/logins)
    └── 权限变更日志 (/audit/permissions)
```

## 二、 详细设计规格 (Specification)

### 1. 多级分组导航组件升级 (`packages/ui/src/components/layout/Sidebar.tsx`)

- 重构 `Sidebar` 组件，从当前的单层列表升级为**多级分组折叠目录树**：
  - 支持分组标题（如“业务中心”、“系统管理”）；
  - 支持二级折叠节点（如“组织架构”下拉包含员工管理、部门管理、岗位管理）；
  - 维持现代化数智工业风：纯白浮动、微细描边、Lucide 矢量图标，杜绝 Emoji；
  - 自动依据当前 URL 路径高亮激活菜单项并默认展开所属父菜单。

### 2. 企业设置中心页面与服务 (`apps/tenant/src/app/(dashboard)/settings/`)

#### A. 企业信息 (`/settings/company/page.tsx`)

- 读写租户物理库中的 `CompanyProfile` 实体。
- 字段维护：
  - 企业全称 (`companyName`)
  - 企业简称 (`shortName`)
  - 统一社会信用代码 (`creditCode`)
  - 法定代表人 (`legalPerson`)
  - 业务联系电话 (`contactPhone`)
  - 官方联系邮箱 (`contactEmail`)
  - 注册/经营地址 (`address`)
  - 系统时区 (`timezone`，如 Asia/Shanghai)
  - 本位币种 (`currency`，如 CNY)
- 提交保存通过 Server Actions 直调 Tenant DB，带权限门禁保护（仅 admin/owner 可修改）。

#### B. 基础设置 (`/settings/general/page.tsx`)

- 维护租户级通用偏好（保存在 `CompanyProfile` 或租户配置表中）：
  - 系统显示名称（允许企业自定义顶部 Header 标题）；
  - 默认表格分页大小（10 / 20 / 50 条）；
  - 业务单据编码前缀与自动编号规则（如采购单前缀 `PO-`）；
  - 数据展示格式（日期格式、金额小数位数）。

#### C. 安全设置 (`/settings/security/page.tsx`)

- 维护租户安全策略偏好：
  - 会话闲置自动登出时间（15 分钟 / 30 分钟 / 1 小时 / 8 小时）；
  - 初始密码强制修改策略开关（首次登录强制修改默认密码）；
  - 密码复杂度规则展示（最小长度、数字与特殊字符要求）。

## 三、 范围内能力

1. 升级 `@chenrun/ui` 的 `Sidebar` 支持多级分组折叠导航。
2. 落地 `apps/tenant/src/app/(dashboard)/settings/company/`、`general/` 与 `security/` 三大页面。
3. 封装 `TenantSettingsService` 处理租户设置读写与默认回退。
4. 单元测试覆盖多级导航渲染逻辑与企业设置 Server Actions。

## 四、 明确不做

- 组织架构具体人员与部门操作（交由 `p0-tenant-org-management`）。
