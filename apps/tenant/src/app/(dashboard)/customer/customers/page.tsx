import React from "react";
import {
  CustomerView,
  listCustomersAction,
  getCategoryTreeAction,
  listTagsAction,
} from "@chenrun/feature-customer-center";
import { toPlainData } from "@chenrun/shared";

export default async function CustomersPage() {
  const [custRes, catRes, tagsRes] = await Promise.all([
    listCustomersAction(),
    getCategoryTreeAction(),
    listTagsAction(),
  ]);

  const customers =
    custRes.success && custRes.data ? toPlainData(custRes.data) : [];
  const categories =
    catRes.success && catRes.data ? toPlainData(catRes.data) : [];
  const tags = tagsRes.success && tagsRes.data ? toPlainData(tagsRes.data) : [];

  return (
    <CustomerView
      initialCustomers={customers}
      categories={categories}
      tags={tags}
    />
  );
}
