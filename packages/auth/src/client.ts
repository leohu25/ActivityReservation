import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";

/**
 * Better Auth 前端浏览器单例客户端
 * 配置 organizationClient 插件以支持租户查询与组织切换
 */
export const authClient = createAuthClient({
  plugins: [organizationClient()],
});

export const { signIn, signOut, signUp, useSession, organization } = authClient;

export { AuthModal, type AuthModalProps } from "./client/AuthModal";
export { OrgSwitcher, type OrgSwitcherProps } from "./client/OrgSwitcher";
