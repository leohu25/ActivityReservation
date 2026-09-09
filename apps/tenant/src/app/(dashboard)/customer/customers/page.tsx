import React from "react";
import {
  CustomerView,
  listCustomersAction,
  getCategoryTreeAction,
  listTagsAction,
} from "@chenrun/feature-customer-center";

export default async function CustomersPage() {
  const [custRes, catRes, tagsRes] = await Promise.all([
    listCustomersAction(),
    getCategoryTreeAction(),
    listTagsAction(),
  ]);

  const customers = custRes.success && custRes.data ? custRes.data : [];
  const categories = catRes.success && catRes.data ? catRes.data : [];
  const tags = tagsRes.success && tagsRes.data ? tagsRes.data : [];

  return (
    <CustomerView
      initialCustomers={customers}
      categories={categories}
      tags={tags}
    />
  );
}
