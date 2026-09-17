# 验证方案与验收标准 — arch-ui-shadcn-official-standardization

## 验证项目

1. **类型检查**：`pnpm --filter @base/ui check` 必须 0 错误；
2. **单元测试**：`pnpm --filter @base/ui test` 必须全部 PASS，且原 `Select.test.tsx` 迁移验证通过；
3. **全局门禁**：`node scripts/verify.mjs` 必须 100% 绿灯；
4. **业务层无感**：`packages/domains/customer-center` 等业务切片导入 `Badge`、`Select`、`DataTable` 行为完全保持一致。
