import { headers } from "next/headers";
import { AlertCircle } from "lucide-react";
import { getServerAuthRuntime } from "@chenrun/auth";
import { getTenantDbManager } from "@chenrun/db-tenant";
import {
  PositionService,
  PositionView,
} from "@chenrun/feature-tenant-admin";
import { Card } from "@chenrun/ui";

/**
 * 岗位字典管理页面 (Server Component - 极薄装配层)
 */
export default async function OrganizationPositionsPage() {
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
          <span>您当前不是该租户组织的成员，无权访问岗位管理</span>
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
          <span>权限不足：仅企业管理员 (owner / admin) 允许管理岗位字典</span>
        </div>
      </Card>
    );
  }

  // 获取租户物理库客户端并检索岗位数据
  const manager = getTenantDbManager({
    repository: runtime.tenantContextRepository,
  });
  const tenantPrisma = await manager.getClient(activeOrgId);
  const positionService = new PositionService();
  const positions = await positionService.listPositions(tenantPrisma);

  return <PositionView initialPositions={positions} />;
}
