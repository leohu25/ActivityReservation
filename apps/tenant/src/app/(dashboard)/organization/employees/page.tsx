import { headers } from "next/headers";
import { AlertCircle } from "lucide-react";
import { getServerAuthRuntime } from "@chenrun/auth";
import { getTenantDbManager } from "@chenrun/db-tenant";
import {
  DepartmentService,
  EmployeeManagementService,
  EmployeeView,
  PositionService,
  TenantRoleService,
} from "@chenrun/feature-tenant-admin";
import { Card } from "@chenrun/ui";

/**
 * 员工档案与人事管理页面 (Server Component - 极薄装配层)
 */
export default async function OrganizationEmployeesPage() {
  const runtime = getServerAuthRuntime();
  const session = await runtime.auth.api.getSession({
    headers: await headers(),
  });

  const activeOrgId = session?.session.activeOrganizationId;

  if (!activeOrgId) {
    return (
      <Card className="border-amber-200 bg-amber-50/50 p-6 text-amber-800 shadow-xs dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
        <div className="flex items-center gap-2 font-bold text-sm">
          <AlertCircle className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>请先在工作台或顶部选择并激活一个租户组织</span>
        </div>
      </Card>
    );
  }

  // 校验管理员身份
  const currentMember = await runtime.tenantContextRepository.findMember(
    activeOrgId,
    session.user.id,
  );

  if (!currentMember) {
    return (
      <Card className="border-rose-200 bg-rose-50/50 p-6 text-rose-800 shadow-xs dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-200">
        <div className="flex items-center gap-2 font-bold text-sm">
          <AlertCircle className="size-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>您当前不是该租户组织的成员，无权访问员工管理</span>
        </div>
      </Card>
    );
  }

  const roleList = currentMember.role
    .split(",")
    .map((r) => r.trim())
    .filter(Boolean);
  const isTenantAdmin =
    roleList.includes("owner") || roleList.includes("admin");

  if (!isTenantAdmin) {
    return (
      <Card className="border-rose-200 bg-rose-50/50 p-6 text-rose-800 shadow-xs dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-200">
        <div className="flex items-center gap-2 font-bold text-sm">
          <AlertCircle className="size-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>权限不足：仅企业管理员 (owner / admin) 允许管理员工档案</span>
        </div>
      </Card>
    );
  }

  // 获取租户物理库客户端并联合检索员工、部门树、岗位与角色数据
  const manager = getTenantDbManager({
    repository: runtime.tenantContextRepository,
  });
  const tenantPrisma = await manager.getClient(activeOrgId);
  const controlPrisma = runtime.prisma;

  const empService = new EmployeeManagementService();
  const deptService = new DepartmentService();
  const posService = new PositionService();
  const roleService = new TenantRoleService(runtime.tenantContextRepository);

  const [employees, departmentTree, positions, tenantRoles] =
    await Promise.all([
      empService.listEmployees(tenantPrisma, controlPrisma, activeOrgId),
      deptService.listDepartmentTree(tenantPrisma),
      posService.listPositions(tenantPrisma),
      roleService.listTenantRoles(activeOrgId),
    ]);

  const availableRoles = tenantRoles.map((r) => ({
    role: r.role,
    name: r.name,
  }));

  return (
    <EmployeeView
      initialEmployees={employees}
      departmentTree={departmentTree}
      positions={positions}
      availableRoles={availableRoles}
    />
  );
}
