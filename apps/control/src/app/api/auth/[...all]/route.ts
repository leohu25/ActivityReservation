import { toNextJsHandler } from "better-auth/next-js";
import { getControlAuthRuntime } from "@chenrun/feature-control-admin";

/**
 * 控制平面认证路由处理程序 (Better Auth API Route)
 */
const authHandler = toNextJsHandler(getControlAuthRuntime().auth);

export const GET = authHandler.GET;
export const POST = authHandler.POST;
