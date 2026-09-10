import React from "react";
import {
  QuoteView,
  CustomerQuoteSubject,
  listQuotesAction,
  listCustomersAction,
  listStoresAction,
} from "@chenrun/feature-customer-center";
import { toPlainData } from "@chenrun/shared";
import { getTenantSubjectPermissions } from "@/lib/get-tenant-ability";

export default async function QuotesPage() {
  const [quotesRes, custRes, storesRes, permissions] = await Promise.all([
    listQuotesAction(),
    listCustomersAction(),
    listStoresAction(),
    getTenantSubjectPermissions(CustomerQuoteSubject),
  ]);

  const quotes =
    quotesRes.success && quotesRes.data ? toPlainData(quotesRes.data) : [];
  const customers =
    custRes.success && custRes.data ? toPlainData(custRes.data) : [];
  const stores =
    storesRes.success && storesRes.data ? toPlainData(storesRes.data) : [];

  return (
    <QuoteView
      initialQuotes={quotes}
      customers={customers}
      stores={stores}
      ability={permissions}
    />
  );
}
