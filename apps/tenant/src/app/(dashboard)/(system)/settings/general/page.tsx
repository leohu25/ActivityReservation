import { redirect } from "next/navigation";

/**
 * 基础设置已与基础设施配置合并，平滑重定向至 /settings/company
 */
export default function SettingsGeneralPage() {
  redirect("/settings/company");
}
