import { toNextJsHandler } from "better-auth/next-js";
import { getPlatformAuthRuntime } from "@chenrun/feature-platform-admin";

const authHandler = toNextJsHandler(getPlatformAuthRuntime().auth);

export const GET = authHandler.GET;
export const POST = authHandler.POST;
