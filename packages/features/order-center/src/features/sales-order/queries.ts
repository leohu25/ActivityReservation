import "server-only";

import { getAccessibleWhere } from "@base/authorization";
import {
  assertOrderAbility,
  getTenantOrderContext,
} from "../../assembly/context";
import { SalesOrderSubject } from "./contract";
import {
  listSalesOrders,
  getSalesOrderDetail,
  findEffectiveQuotationPrice,
} from "./service";
import type {
  ListSalesOrdersParams,
  PaginatedSalesOrders,
  SalesOrderDetail,
} from "./types";
import { toPlainData } from "@base/shared";

/**
 * RSC 纯服务端只读查询：销售订单分页列表（带 CASL 数据范围物理下推）
 */
export async function listSalesOrdersQuery(
  params: ListSalesOrdersParams,
): Promise<PaginatedSalesOrders> {
  const { client, ability } = await getTenantOrderContext();
  assertOrderAbility(ability, "read", SalesOrderSubject);

  const accessibleWhere = getAccessibleWhere(
    ability,
    SalesOrderSubject,
    "read",
  );
  const result = await listSalesOrders(client, params, accessibleWhere as any);
  return toPlainData(result);
}

/**
 * RSC 纯服务端只读查询：销售订单详情
 */
export async function getSalesOrderDetailQuery(
  orderId: string,
): Promise<SalesOrderDetail> {
  const { client, ability } = await getTenantOrderContext();
  assertOrderAbility(ability, "read", SalesOrderSubject);

  const detail = await getSalesOrderDetail(client, orderId);
  return toPlainData(detail);
}

/**
 * 查询客户所有可用门店及商品报价
 */
export async function getStoreAndQuotationOptionsQuery(params: {
  customerCode?: string;
  storeCode?: string;
  itemCode?: string;
}) {
  const { client } = await getTenantOrderContext();
  const [customers, stores, quote] = await Promise.all([
    client.customer.findMany({
      where: { status: "ACTIVE", isDeleted: false },
      select: {
        customerCode: true,
        customerName: true,
        defaultTaxRate: true,
        customerTags: true,
      },
      orderBy: { customerCode: "asc" },
    }),
    params.customerCode
      ? client.customerStore.findMany({
          where: {
            customerCode: params.customerCode,
            status: "ACTIVE",
            isDeleted: false,
          },
          select: {
            storeCode: true,
            storeName: true,
            regionCode: true,
            deliveryPeriod: true,
            defaultRoute: true,
            defaultDriver: true,
          },
          orderBy: { storeCode: "asc" },
        })
      : [],
    params.customerCode && params.storeCode && params.itemCode
      ? findEffectiveQuotationPrice(client, {
          customerCode: params.customerCode,
          storeCode: params.storeCode,
          itemCode: params.itemCode,
        })
      : null,
  ]);

  return toPlainData({
    customers,
    stores,
    quote,
  });
}
