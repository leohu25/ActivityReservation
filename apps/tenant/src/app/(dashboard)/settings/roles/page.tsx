import { headers } from "next/headers";
import { AlertCircle } from "lucide-react";
import { getServerAuthRuntime } from "@base/auth";
import { RolePermissionManager } from "@base/feature-tenant-admin/role-management";
import { listTenantRolesQuery } from "@base/feature-tenant-admin/role-management/server";
import { Card } from "@base/ui";
import {
  ALL_TENANT_MANIFESTS,
  globalTenantPermissionTree,
  getTenantSubjectPermissions,
  getTenantCustomMenuTree,
} from "@/kernel";
import { deriveMenuAlignedPermissionTree } from "@base/authorization";

/**
 * 租户角色与权限管理页面 (Server Component - 极薄装配线)
 * 仅负责读取当前激活租户上下文并装配 @base/feature-tenant-admin 业务切片
 */
export default async function SettingsRolesPage() {
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

  // 1. 检查当前用户的租户成员身份与角色权限 (Fail-Closed)
  const currentMember = await runtime.tenantContextRepository.findMember(
    activeOrgId,
    session.user.id,
  );

  if (!currentMember) {
    return (
      <Card className="border-rose-200 bg-rose-50/50 p-6 text-rose-800 shadow-xs dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-200">
        <div className="flex items-center gap-2 font-bold text-sm">
          <AlertCircle className="size-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>您当前不是该租户组织的成员，无权访问管理后台</span>
        </div>
      </Card>
    );
  }

  const roleList = currentMember.role
    .split(",")
    .map((r) => r.trim())
    .filter(Boolean);

  // 官方 CASL：layout 已注入 AbilityProvider；这里用同一套快照做 RSC 门禁
  const rolePerms = await getTenantSubjectPermissions("RoleManagement");
  const canReadRoles = rolePerms.actions.includes("read");
  // 过渡兜底：历史 admin 可能尚未保存 statement，避免锁死配置页
  const isTenantAdmin =
    canReadRoles || roleList.includes("owner") || roleList.includes("admin");

  if (!isTenantAdmin) {
    return (
      <Card className="border-rose-200 bg-rose-50/50 p-6 text-rose-800 shadow-xs dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-200">
        <div className="flex items-center gap-2 font-bold text-sm">
          <AlertCircle className="size-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>
            权限不足 (403)：仅企业管理员 (owner / admin)
            允许访问并配置角色与权限
          </span>
        </div>
      </Card>
    );
  }

  // 2. 加载当前租户下的全量角色列表 (通过 Server Query，包含内置与自定义角色)
  const roles = await listTenantRolesQuery(ALL_TENANT_MANIFESTS);

  // 3. 读取租户当前自定义业务菜单树，动态组装出与菜单层级 100% 对齐的角色权限树
  const customMenuTree = await getTenantCustomMenuTree(activeOrgId);
  const alignedPermissionTree = deriveMenuAlignedPermissionTree(
    ALL_TENANT_MANIFESTS,
    customMenuTree,
  );

  return (
    <div className="space-y-6">
      <RolePermissionManager
        initialRoles={roles}
        activeOrgId={activeOrgId}
        permissionTree={
          alignedPermissionTree.length > 0
            ? alignedPermissionTree
            : globalTenantPermissionTree
        }
      />
    </div>
  );
}
