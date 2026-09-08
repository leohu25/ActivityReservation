# 验证方法与验收标准：【P1】租户全生命周期管控与排期安全清理 (p1-tenant-lifecycle-governance)

## 验证方法

1. 业务领域服务测试：
   - 编写 `tenant-lifecycle.test.ts`：
     - 测试租户挂起（SUSPENDED）：验证业务访问拦截，但所属 User 的其他有效租户 Session 与全局登录不受任何影响（验证 R-04）；
     - 测试租户恢复（RESUME）：验证状态翻转为 ACTIVE；
     - 测试物理清理：验证严格按照顺序：备份 -> Drop 租户库 -> 清除 Organization 映射 -> 留存 Audit，绝不留存孤儿物理库。
2. 控制平面页面测试：
   - 访问 `apps/control` 的租户列表，检查状态展示与启停/删除操作。
3. 全栈门禁：
   - 执行 `./scripts/verify.sh`。

## 验收条件 (Definition of Done)

- [ ] 租户生命周期完整流转。
- [ ] 租户停用严格不封禁全局 User（R-04）。
- [ ] 租户清理严格先销毁物理库再清理 Control DB 映射。
- [ ] `./scripts/verify.sh` 100% 通过。
