import {
    CustomerView,
    type CustomerListItem,
} from "@base/feature-customer-center/customer-management";
import {
    listCustomersQuery,
    getCustomerPageOptionsQuery,
} from "@base/feature-customer-center/customer-management/server";

type SearchParams = Record<string, string | string[] | undefined>;

function readOne(sp: SearchParams, key: string): string {
    const value = sp[key];
    if (Array.isArray(value)) return value[0] ?? "";
    return value ?? "";
}

function readInt(sp: SearchParams, key: string, fallback: number): number {
    const value = parseInt(readOne(sp, key), 10);
    return Number.isFinite(value) && value > 0 ? value : fallback;
}

/** 客户档案页：路由只解析 URL 并装配 Feature Query 与 UI。 */
export default async function CustomersPage({
    searchParams,
}: {
    searchParams: Promise<SearchParams>;
}) {
    const params = await searchParams;
    const page = readInt(params, "page", 1);
    const pageSize = Math.min(100, readInt(params, "pageSize", 10));
    const keyword = readOne(params, "keyword");
    const categoryCode = readOne(params, "category");
    const status = readOne(params, "status");

    const [customerPage, pageOptions] = await Promise.all([
        listCustomersQuery({
            page,
            pageSize,
            keyword: keyword || undefined,
            categoryCode: categoryCode || undefined,
            status: status || undefined,
        }),
        getCustomerPageOptionsQuery(),
    ]);

    return (
        <CustomerView
            initialCustomers={customerPage.items as CustomerListItem[]}
            initialTotal={customerPage.total}
            initialPage={page}
            initialPageSize={pageSize}
            initialKeyword={keyword}
            initialCategory={categoryCode}
            initialStatus={status}
            categoryOptions={pageOptions.categoryOptions}
            tagOptions={pageOptions.tagOptions}
        />
    );
}
