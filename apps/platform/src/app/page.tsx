import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * 平台总控根路由：自动重定向至多页面子路由 /overview
 */
export default function PlatformRootPage(): never {
 redirect("/overview");
}
