import { toNextJsHandler } from "better-auth/next-js";
import { getServerAuth } from "@chenrun/auth";

function handlers() {
  return toNextJsHandler(getServerAuth());
}

export async function GET(request: Request): Promise<Response> {
  return handlers().GET(request);
}

export async function POST(request: Request): Promise<Response> {
  return handlers().POST(request);
}
