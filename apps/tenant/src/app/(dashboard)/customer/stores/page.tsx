import {
  StoreView,
  CustomerStoreSubject,
  listStoresAction,
  listCustomersAction,
} from "@chenrun/feature-customer-center";
import { toPlainData } from "@chenrun/shared";
import { getTenantSubjectPermissions } from "@/kernel";

export default async function StoresPage() {
  const [storesRes, custRes, permissions] = await Promise.all([
    listStoresAction(),
    listCustomersAction(),
    getTenantSubjectPermissions(CustomerStoreSubject),
  ]);

  const stores =
    storesRes.success && storesRes.data ? toPlainData(storesRes.data) : [];
  const customers =
    custRes.success && custRes.data ? toPlainData(custRes.data) : [];

  return (
    <StoreView
      initialStores={stores}
      customers={customers}
      permissions={permissions}
    />
  );
}
