import React from "react";
import { notFound } from "next/navigation";
import { getTenantDbManager } from "@base/db-tenant";
import { getServerAuthRuntime } from "@base/auth";
import { ActivityDetailClient } from "./client";

interface ActivityDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ActivityDetailPage({ params }: ActivityDetailPageProps) {
  const { id } = await params;

  const runtime = getServerAuthRuntime();
  let orgId = "01a0d2ea-1691-7508-8ad3-bbd232a45b72";
  try {
    const org = await runtime.prisma.organization.findFirst({ select: { id: true } });
    if (org?.id) orgId = org.id;
  } catch {
    // 降级使用默认
  }

  const manager = getTenantDbManager({ repository: runtime.tenantContextRepository });
  const prisma = await manager.getClient(orgId);

  const activity = await prisma.activity.findUnique({
    where: { id, isDeleted: false },
    include: {
      venue: true,
      sessions: {
        where: { isDeleted: false },
        orderBy: [{ date: "asc" }, { startTime: "asc" }],
      },
    },
  });

  if (!activity) {
    notFound();
  }

  return <ActivityDetailClient activity={activity} />;
}
