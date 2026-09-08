# 验证方法与验收标准：【P0】组织架构中心：部门树维护、岗位字典与直接录入建号 (p0-tenant-org-management)

## 验证方法

1. 业务领域服务测试：
   - 编写 `department-service.test.ts`：测试部门树构建、防环调级（拦截自环或后代循环引用）、删除保护（拦截有员工或子部门）；
   - 编写 `position-service.test.ts`：测试岗位 CRUD、排序与推荐角色；
   - 编写 `employee-management.test.ts`：
     - 测试直接录入员工：验证原子创建 Control DB User + Member 及 Tenant DB EmployeeProfile，状态为 ACTIVE；
     - 测试新员工凭录入的初始密码登录，获取有效 Session；
     - 测试调部门与调角色：验证对应实体更新，且 Control DB `authorizationVersion` 自增；
     - 测试停用员工：验证状态变为 SUSPENDED。
2. 页面与交互测试：
   - 访问 `/organization/departments`、`/positions` 与 `/employees`，验证增删改查交互与部门树联动。
3. 全栈门禁：
   - 执行 `./scripts/verify.sh`。

## 验收条件 (Definition of Done)

- [ ] 部门树维护完整可用，带防环与删除保护。
- [ ] 岗位字典维护可用，且不与权限强绑定。
- [ ] 管理员可通过【新增员工】直接建号开通在职员工，新员工可立即凭初始密码登录。
- [ ] 调部门与改角色触发 `authorizationVersion++`。
- [ ] `./scripts/verify.sh` 100% 通过。
