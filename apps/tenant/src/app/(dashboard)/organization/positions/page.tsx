import { headers } from "next/headers";
import { AlertCircle } from "lucide-react";
import { getServerAuthRuntime } from "@chenrun/auth";
import {
  PositionView,
  type PositionItem,
} from "@chenrun/feature-tenant-admin/org-management";
import { listPositionsQuery } from "@chenrun/feature-tenant-admin/org-management/server";
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

  // 校验组织成员身份
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

  // 获取租户物理库客户端并检索岗位数据 (含 CASL 门禁与租户物理库路由)
  const positions: readonly PositionItem[] = await listPositionsQuery();

  return <PositionView initialPositions={positions} />;
}
