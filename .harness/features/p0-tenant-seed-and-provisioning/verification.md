# 验证方法与验收标准：【P0】租户开通与初始数据种子初始化 (p0-tenant-seed-and-provisioning)

## 验证方法

1. 业务开通与 Seed 单测：
   - 编写 `tenant-seed-provisioning.test.ts`：
     - 测试开通租户后，验证 Tenant DB 物理库已存在 ROOT 根部门；
     - 验证已存在 3 个基础 Position 字典项（总经理、主管、专员）；
     - 验证已存在 Owner 的 `EmployeeProfile` 且状态为 ACTIVE；
     - 验证 Control DB 已初始化 `owner` 预置角色策略；
     - 验证操作员超管未被加入租户 Member（R-01 规则）。
2. 端到端登录测试：
   - 使用开通成功返回的 Owner 邮箱与初始密码，调用 Better Auth 登录接口，验证能成功获取有效 Session 并切换至新租户。
3. 全栈门禁：
   - 执行 `./scripts/verify.sh`。

## 验收条件 (Definition of Done)

- [ ] 租户开通后物理库自动具备 ROOT 部门、基础岗位字典与 Owner 档案。
- [ ] 平台超管严禁成为租户 Member。
- [ ] Owner 凭开通生成的密码可直接登录进入系统。
- [ ] `./scripts/verify.sh` 100% 通过。
