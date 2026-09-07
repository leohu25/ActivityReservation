# 验证命令与判定标准：采购中心 (procurement-center)

## 专属验证命令

```bash
pnpm --filter @chenrun/procurement-center test
./scripts/verify.sh
```

## 判定基准

1. 权限守卫拦截测试：未授权访问直接拦截并抛出 Forbidden。
2. 敏感字段脱敏测试：无成本价权限时序列化结果不含 `costPrice`。
3. 数据范围测试：普通采购员仅能查询到本部门及下级部门订单。
4. 业务规则测试：自审订单时明确抛出业务拒绝错误。
