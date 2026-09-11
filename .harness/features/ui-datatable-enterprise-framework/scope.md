# ui-datatable-enterprise-framework 白名单范围

```yaml
# 允许修改的源码与测试文件白名单
whitelist_patterns:
  - "packages/ui/src/components/composite/data-table/**"
  - "packages/ui/src/components/primitives/table.tsx"
  - ".agents/skills/erp-feature-dev/**"
  - "feature_list.json"
  - "member.local.md"
  - ".harness/features/ui-datatable-enterprise-framework/**"
  # 服务端分页闭环：客户列表 API/页面接线（用户明确要求禁止全量客户端分页）
  - "packages/features/customer-center/src/components/CustomerView.tsx"
  - "packages/features/customer-center/src/components/CustomerView.test.tsx"
  - "packages/features/customer-center/src/components/StoreView.tsx"
  - "packages/features/customer-center/src/components/QuoteView.tsx"
  - "packages/features/customer-center/src/services/customer-service.ts"
  - "packages/features/customer-center/src/actions.ts"
  - "packages/features/customer-center/src/types.ts"
  - "apps/tenant/src/app/**/customer/**"

# 严禁越界的目录
forbidden_patterns:
  - "apps/**"
  - "packages/features/**"
  - "packages/db-*/**"
  - "packages/auth/**"
  - "packages/authorization/**"
```
