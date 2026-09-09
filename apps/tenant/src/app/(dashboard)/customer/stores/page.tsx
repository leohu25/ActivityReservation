import React from "react";
import {
  StoreView,
  listStoresAction,
  listCustomersAction,
} from "@chenrun/feature-customer-center";

export default async function StoresPage() {
  const [storesRes, custRes] = await Promise.all([
    listStoresAction(),
    listCustomersAction(),
  ]);

  const stores = storesRes.success && storesRes.data ? storesRes.data : [];
  const customers = custRes.success && custRes.data ? custRes.data : [];

  return <StoreView initialStores={stores} customers={customers} />;
}
