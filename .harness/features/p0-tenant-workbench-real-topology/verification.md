# 验证方法与验收标准：【P0】工作台真实拓扑装配与租户访问门禁 (p0-tenant-workbench-real-topology)

## 验证方法

1. 权限与拓扑自驱装配测试：
   - 编写 `workbench-topology.test.ts`：
     - 测试在真实 EmployeeProfile 下，工作台根据部门树动态计算并展示正确的 `departmentTreeIds` 与生效数据范围；
     - 验证工作台源码中没有任何写死的静态 mock 拓扑数据。
2. 租户访问门禁测试：
   - 编写 `tenant-access-gate.test.ts`：
     - 测试当员工状态为 `SUSPENDED` 时，访问页面或触发 Server Action 立即抛出拦截异常；
     - 测试当员工状态为 `TERMINATED` 时，拦截访问；
     - 测试当管理员调换员工部门时，无需重启或重新登录，采购单查询的下推过滤条件即刻依据新部门树变化。
3. 全栈门禁：
   - 执行 `./scripts/verify.sh`。

## 验收条件 (Definition of Done)

- [ ] 工作台彻底移除所有写死 mock topology，完全自驱从物理库读取。
- [ ] 租户访问门禁严格生效，非 ACTIVE 状态员工无法访问业务系统。
- [ ] 调部门后采购订单中心数据范围即时联动下推。
- [ ] `./scripts/verify.sh` 100% 通过。
