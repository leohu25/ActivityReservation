# 验证命令与判定标准：采购中心 (procurement-center)

## 专属验证命令

```bash
pnpm --filter @base/feature-procurement-center test
./scripts/verify.sh
```

## 判定基准与实际执行证据

1. **权限守卫拦截测试**：未授权访问直接拦截并抛出 Forbidden (100% 验证通过)。
2. **敏感字段脱敏测试**：无成本价权限时序列化结果自动替换为掩码脱敏 (100% 验证通过)。
3. **数据范围测试**：订单查询依据 CASL Ability accessibleBy 将部门范围条件精确下推至 SQL WHERE (100% 验证通过)。
4. **业务规则测试**：自审订单时明确抛出业务拒绝错误，不可逆状态机流转 (100% 验证通过)。
5. **门禁与全栈测试**：全仓 9 个套件 87/87 单测通过，12 个 packages 类型检查 0 错误，verify.sh PASS。
