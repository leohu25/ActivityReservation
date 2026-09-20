import { getTenantWorkbenchData } from "@/kernel";
import { getTenantMultiSubjectPermissions } from "@/kernel/permissions";
import { getDepartmentCountQuery } from "@platform/tenant-admin/org-management/server";
import { getRoleCountQuery } from "@platform/tenant-admin/role-management/server";
import { getCustomerCountQuery } from "@domain/customer-center/customer-management/server";
import { getCategoryCountQuery } from "@domain/customer-center/customer-management/category/server";
import { listTagsQuery } from "@domain/customer-center/customer-management/tag/server";
import { MultiEntityWorkbenchView } from "./_components/multi-entity-workbench-view";

/**
 * 租户综合工作台（多实体权限沙盒与指标看板聚合 RSC）
 * 遵循 Next.js App Router 极薄装配线与 Fail-Closed 隔离规范：
 * 1. 跨切片并发查询：各领域 Query 独立执行租户分库路由与 CASL 权限下推；
 * 2. Promise.allSettled 故障隔离：单实体无权或查库异常仅降级自身卡片，绝不引发整页 500/白屏；
 * 3. 强类型权限快照：服务端统一提取多实体的纯数据权限描述，供客户端 CASL 边界受控渲染。
 */
export default async function WorkbenchPage() {
  // 1. 核心租户身份与业务准入上下文
  const workbenchData = await getTenantWorkbenchData();

  // 2. 批量提取工作台自身视图及所涉 5 大业务实体的 CASL 权限快照
  const permissions = await getTenantMultiSubjectPermissions([
    "Workbench",
    "Department",
    "Role",
    "Customer",
    "CustomerCategory",
    "CustomerTag",
  ]);

  // 3. 并发执行多实体数据查询（故障相互隔离）
  const [deptRes, roleRes, customerRes, categoryRes, tagsRes] =
    await Promise.allSettled([
      getDepartmentCountQuery(),
      getRoleCountQuery(),
      getCustomerCountQuery(),
      getCategoryCountQuery(),
      listTagsQuery({ page: 1, pageSize: 12 }),
    ]);

  const counts = {
    department: deptRes.status === "fulfilled" ? deptRes.value : null,
    role: roleRes.status === "fulfilled" ? roleRes.value : null,
    customer: customerRes.status === "fulfilled" ? customerRes.value : null,
    category: categoryRes.status === "fulfilled" ? categoryRes.value : null,
  };

  const tags =
    tagsRes.status === "fulfilled" && tagsRes.value?.items
      ? tagsRes.value.items
      : [];

  return (
    <MultiEntityWorkbenchView
      pageData={workbenchData}
      permissions={permissions}
      counts={counts}
      tags={tags}
    />
  );
}
