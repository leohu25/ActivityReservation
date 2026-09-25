import { notFound } from "next/navigation";
import { getTenantDbManager } from "@base/db-tenant";
import { getServerAuthRuntime } from "@base/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const runtime = getServerAuthRuntime();
  const manager = getTenantDbManager({ repository: runtime.tenantContextRepository });
  const prisma = await manager.getClient("01a0d2ea-1691-7508-8ad3-bbd232a45b72");

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
    return notFound();
  }

  return Response.json(activity);
}
