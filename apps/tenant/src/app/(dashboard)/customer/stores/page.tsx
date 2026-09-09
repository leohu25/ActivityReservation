import React from "react";
import {
  StoreView,
  listStoresAction,
  listCustomersAction,
} from "@chenrun/feature-customer-center";
import { toPlainData } from "@chenrun/shared";

export default async function StoresPage() {
  const [storesRes, custRes] = await Promise.all([
    listStoresAction(),
    listCustomersAction(),
  ]);

  const stores =
    storesRes.success && storesRes.data ? toPlainData(storesRes.data) : [];
  const customers =
    custRes.success && custRes.data ? toPlainData(custRes.data) : [];

  return <StoreView initialStores={stores} customers={customers} />;
}
