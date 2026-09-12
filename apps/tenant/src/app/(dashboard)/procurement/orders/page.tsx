import { AlertCircle } from "lucide-react";
import { Card } from "@base/ui";
import { ProcurementOrderCenter } from "@base/feature-procurement-center";
import { getProcurementOrdersPageData } from "@base/feature-procurement-center/server";

/**
 * 采购订单中心业务页面（极薄服务端装配组件）
 * 数据读取、拓扑装配、门禁拦截与 CASL 权限编译均已内聚于切片服务端门面
 */
export default async function ProcurementOrdersPage() {
  const result = await getProcurementOrdersPageData();

  if (result.isBlocked) {
    return (
      <Card className="border-amber-200 bg-amber-50/50 p-6 text-amber-800 shadow-xs dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
        <div className="flex items-center gap-2 font-bold text-sm">
          <AlertCircle className="size-4 text-amber-600 shrink-0" />
          <span>{result.message}</span>
        </div>
      </Card>
    );
  }

  return <ProcurementOrderCenter {...result.props} />;
}
