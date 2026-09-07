# 专属验证规范模板：[特性名称] (<feature_id>)

## 验证执行命令

```bash
# 执行当前 Feature 专属单测
pnpm --filter @chenrun/<feature_id> test

# 执行全栈门禁自检
./scripts/verify.sh
```

## 判定准则

1. 单元测试 100% 通过。
2. TypeScript 类型检查 0 错误 (`pnpm type-check`)。
3. 权限安全攻防用例校验完毕。
