# 验证方法与验收标准：【P0】租户后台多级导航与企业/基础/安全设置中心 (p0-tenant-navigation-and-settings)

## 验证方法

1. 导航渲染与路由激活单测：
   - 编写 `sidebar-navigation.test.tsx`：
     - 测试在不同路径下（如 `/organization/departments`、`/settings/company`），所属父级目录能自动保持展开并高亮对应子项；
     - 验证各菜单项具备正确的路由地址与图标。
2. 企业设置表单读写测试：
   - 编写 `tenant-settings.test.ts`：
     - 测试读写 `CompanyProfile`（企业名称、信用代码、联系方式、时区、本位币）；
     - 测试基础设置与安全策略偏好配置持久化与回读。
3. 全栈门禁：
   - 执行 `./scripts/verify.sh`。

## 验收条件 (Definition of Done)

- [ ] 租户后台左侧导航完整展示第 48 节目录树结构（首页、业务模块、系统管理：组织架构、权限管理、企业设置、审计日志占位）。
- [ ] 企业信息、基础设置、安全设置三大页面均能正常渲染、保存与回显。
- [ ] 纯白浮动现代数智工业风，无 Emoji，全面采用 Lucide 图标。
- [ ] `./scripts/verify.sh` 100% 通过。
