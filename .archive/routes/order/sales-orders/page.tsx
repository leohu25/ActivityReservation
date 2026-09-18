import {
        SalesOrderView,
        type SalesOrderListItem,
} from "@base/feature-order-center/sales-order";
import {
        listSalesOrdersQuery,
        getStoreAndQuotationOptionsQuery,
} from "@base/feature-order-center/sales-order/server";

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

/** 销售订单列表页：App Router 路由只负责拉取并装配只读数据与组件 */
export default async function SalesOrdersPage({
        searchParams,
}: {
        searchParams: Promise<SearchParams>;
}) {
        const params = await searchParams;
        const page = readInt(params, "page", 1);
        const pageSize = Math.min(100, readInt(params, "pageSize", 10));
        const keyword = readOne(params, "keyword");
        const status = readOne(params, "status");
        const fulfillmentStatus = readOne(params, "fulfillmentStatus");
        const orderType = readOne(params, "orderType");

        const [orderPage, options] = await Promise.all([
                listSalesOrdersQuery({
                        page,
                        pageSize,
                        keyword: keyword || undefined,
                        status: status || undefined,
                        fulfillmentStatus: fulfillmentStatus || undefined,
                        orderType: orderType || undefined,
                }),
                getStoreAndQuotationOptionsQuery({}),
        ]);

        return (
                <SalesOrderView
                        initialOrders={orderPage.items as SalesOrderListItem[]}
                        initialTotal={orderPage.total}
                        initialPage={page}
                        initialPageSize={pageSize}
                        initialKeyword={keyword}
                        initialStatus={status}
                        initialFulfillmentStatus={fulfillmentStatus}
                        initialOrderType={orderType}
                        customers={options.customers.map((c) => ({
                                customerCode: c.customerCode,
                                customerName: c.customerName,
                        }))}
                        stores={options.stores.map((s) => ({
                                storeCode: s.storeCode,
                                storeName: s.storeName,
                                customerCode: "",
                        }))}
                />
        );
}
