import { getTenantWorkbenchData } from "@chenrun/feature-tenant-admin/server";
import { WorkbenchView } from "@chenrun/feature-tenant-admin";

/**
 * 工作台页面（极薄服务端组件）
 * 数据查询、员工拓扑自驱装配、CASL Ability 编译与准入门禁均已下沉至切片内部
 */
export default async function WorkbenchPage() {
 const data = await getTenantWorkbenchData();
 return <WorkbenchView data={data} />;
}
