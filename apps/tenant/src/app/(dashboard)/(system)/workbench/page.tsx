import { getTenantWorkbenchData } from "@/kernel";
import { getTenantMultiSubjectPermissions } from "@/kernel/permissions";
import { WorkbenchSubject } from "@platform/tenant-admin/workbench";
import { DepartmentSubject } from "@platform/tenant-admin/org-management";
import { RoleSubject } from "@platform/tenant-admin/role-management";
import { getDepartmentCountQuery } from "@platform/tenant-admin/org-management/server";
import { getRoleCountQuery } from "@platform/tenant-admin/role-management/server";
import { MultiEntityWorkbenchView } from "./_components/multi-entity-workbench-view";

/**
 * 租户综合工作台（管理控制台总览 RSC）
 */
export default async function WorkbenchPage() {
  const workbenchData = await getTenantWorkbenchData();

  const permissions = await getTenantMultiSubjectPermissions([
    WorkbenchSubject,
    DepartmentSubject,
    RoleSubject,
  ]);

  const [deptRes, roleRes] = await Promise.allSettled([
    getDepartmentCountQuery(),
    getRoleCountQuery(),
  ]);

  const counts = {
    department: deptRes.status === "fulfilled" ? deptRes.value : null,
    role: roleRes.status === "fulfilled" ? roleRes.value : null,
    customer: null,
    category: null,
  };

  return (
    <MultiEntityWorkbenchView
      pageData={workbenchData}
      permissions={permissions}
      counts={counts}
      tags={[]}
    />
  );
}
