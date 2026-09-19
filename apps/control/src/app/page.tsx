import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * 控制平面根路由：自动重定向至管控大盘工作台 /workbench
 */
export default function ControlRootPage(): never {
 redirect("/workbench");
}
