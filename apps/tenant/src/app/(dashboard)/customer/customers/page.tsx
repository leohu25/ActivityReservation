import { createResourcePage } from "@base/biz-shared";
import {
  CustomerView,
  customerSearchParams,
  customerPageContract,
  CustomerSubject,
  type CustomerListItem,
} from "@base/feature-customer-center/customer-management";
import {
  listCustomersQuery,
  getCustomerPageOptionsQuery,
} from "@base/feature-customer-center/customer-management/server";
import type { CustomerCategoryItem, CustomerTagItem } from "@base/feature-customer-center/customer-management";

/**
 * 客户档案页：createResourcePage 装配。
 * List 使用业务定制 CustomerView（逃生舱）；URL/取数走工厂约定。
 */
export default createResourcePage<CustomerListItem, {
  categoryOptions: CustomerCategoryItem[];
  tagOptions: CustomerTagItem[];
}>({
  search: customerSearchParams,
  subject: CustomerSubject,
  pageContract: customerPageContract,
  title: "客户档案",
  rowKey: (c) => c.id || c.customerCode,
  columns: [],
  actions: {},
  List: ({ data, total, options }) => (
    <CustomerView
      data={data}
      total={total}
      categoryOptions={options?.categoryOptions}
      tagOptions={options?.tagOptions}
    />
  ),
  query: {
    list: async (parsed) => {
      const pageResult = await listCustomersQuery({
        page: parsed.page,
        pageSize: parsed.pageSize,
        keyword: String(parsed.keyword ?? "") || undefined,
        categoryCode: String(parsed.category ?? "") || undefined,
        status: String(parsed.status ?? "") || undefined,
      });
      return {
        items: pageResult.items as CustomerListItem[],
        total: pageResult.total,
      };
    },
    options: async () => getCustomerPageOptionsQuery(),
  },
});
