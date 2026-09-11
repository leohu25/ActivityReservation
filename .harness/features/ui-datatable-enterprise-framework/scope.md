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


## 附带修改与前置联动 (Spillover / 联动扩围)

- `apps/tenant/src/app/(dashboard)/customer/customers/page.tsx` # 理由：会话开发过程中检测到的联动修改，自动登记扩围
- `apps/tenant/src/app/(dashboard)/customer/quotes/page.tsx` # 理由：会话开发过程中检测到的联动修改，自动登记扩围
- `apps/tenant/src/app/(dashboard)/customer/stores/page.tsx` # 理由：会话开发过程中检测到的联动修改，自动登记扩围
- `packages/features/customer-center/src/actions.ts` # 理由：会话开发过程中检测到的联动修改，自动登记扩围
- `packages/features/customer-center/src/components/CustomerView.test.tsx` # 理由：会话开发过程中检测到的联动修改，自动登记扩围
- `packages/features/customer-center/src/components/CustomerView.tsx` # 理由：会话开发过程中检测到的联动修改，自动登记扩围
- `packages/features/customer-center/src/components/QuoteView.tsx` # 理由：会话开发过程中检测到的联动修改，自动登记扩围
- `packages/features/customer-center/src/components/StoreView.tsx` # 理由：会话开发过程中检测到的联动修改，自动登记扩围
- `packages/features/customer-center/src/services/customer-service.ts` # 理由：会话开发过程中检测到的联动修改，自动登记扩围
- `packages/features/customer-center/src/services/quote-service.ts` # 理由：会话开发过程中检测到的联动修改，自动登记扩围
- `packages/features/customer-center/src/services/store-service.ts` # 理由：会话开发过程中检测到的联动修改，自动登记扩围
- `packages/ui/src/components/composite/data-table/DataTable.test.tsx` # 理由：会话开发过程中检测到的联动修改，自动登记扩围
- `packages/ui/src/components/composite/data-table/DataTableActions.tsx` # 理由：会话开发过程中检测到的联动修改，自动登记扩围
- `packages/ui/src/components/composite/data-table/DataTableColumnSettings.tsx` # 理由：会话开发过程中检测到的联动修改，自动登记扩围
- `packages/ui/src/components/composite/data-table/DataTableContent.tsx` # 理由：会话开发过程中检测到的联动修改，自动登记扩围
- `packages/ui/src/components/composite/data-table/DataTableContext.tsx` # 理由：会话开发过程中检测到的联动修改，自动登记扩围
- `packages/ui/src/components/composite/data-table/DataTableDetailDrawer.tsx` # 理由：会话开发过程中检测到的联动修改，自动登记扩围
- `packages/ui/src/components/composite/data-table/DataTableDetailLayout.tsx` # 理由：会话开发过程中检测到的联动修改，自动登记扩围
- `packages/ui/src/components/composite/data-table/DataTableFilterBar.tsx` # 理由：会话开发过程中检测到的联动修改，自动登记扩围
- `packages/ui/src/components/composite/data-table/DataTableFormLayout.tsx` # 理由：会话开发过程中检测到的联动修改，自动登记扩围
- `packages/ui/src/components/composite/data-table/DataTableFormModal.tsx` # 理由：会话开发过程中检测到的联动修改，自动登记扩围
- `packages/ui/src/components/composite/data-table/DataTableHeader.tsx` # 理由：会话开发过程中检测到的联动修改，自动登记扩围
- `packages/ui/src/components/composite/data-table/DataTableInputGroup.tsx` # 理由：会话开发过程中检测到的联动修改，自动登记扩围
- `packages/ui/src/components/composite/data-table/DataTablePagination.tsx` # 理由：会话开发过程中检测到的联动修改，自动登记扩围
- `packages/ui/src/components/composite/data-table/DataTableRoot.tsx` # 理由：会话开发过程中检测到的联动修改，自动登记扩围
- `packages/ui/src/components/composite/data-table/DataTableRowActions.tsx` # 理由：会话开发过程中检测到的联动修改，自动登记扩围
- `packages/ui/src/components/composite/data-table/DataTableToolbar.tsx` # 理由：会话开发过程中检测到的联动修改，自动登记扩围
- `packages/ui/src/components/composite/data-table/index.ts` # 理由：会话开发过程中检测到的联动修改，自动登记扩围
