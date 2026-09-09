import React from "react";
import {
  QuoteView,
  listQuotesAction,
  listCustomersAction,
  listStoresAction,
} from "@chenrun/feature-customer-center";
import { toPlainData } from "@chenrun/shared";

export default async function QuotesPage() {
  const [quotesRes, custRes, storesRes] = await Promise.all([
    listQuotesAction(),
    listCustomersAction(),
    listStoresAction(),
  ]);

  const quotes =
    quotesRes.success && quotesRes.data ? toPlainData(quotesRes.data) : [];
  const customers =
    custRes.success && custRes.data ? toPlainData(custRes.data) : [];
  const stores =
    storesRes.success && storesRes.data ? toPlainData(storesRes.data) : [];

  return (
    <QuoteView initialQuotes={quotes} customers={customers} stores={stores} />
  );
}
