import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * 控制平面根路由：自动重定向至总控运营大盘 /overview
 */
export default function ControlRootPage(): never {
 redirect("/overview");
}
