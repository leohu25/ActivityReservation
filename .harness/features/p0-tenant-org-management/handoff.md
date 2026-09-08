# 换手交接单：【P0】组织架构中心：部门树维护、岗位字典与直接录入建号 (p0-tenant-org-management)

## 状态总览

- 当前状态: PENDING (待前置特性就绪)
- 负责人: @coordinator -> @implementer
- 前置依赖: `p0-tenant-navigation-and-settings`

## 关键交接事项与注意事项

1. 直接建号需原子处理 Control DB User/Member 与 Tenant DB EmployeeProfile。
2. 调部门与改角色必须自增 `authorizationVersion`。
