import { type NextRequest, NextResponse } from "next/server";
import { extractClientIp } from "@/utils/ip.js";

export const config = {
  matcher: ["/(avatar|domain|ns|profile|credential|search|wallet)/:path*"],
};

const GENERAL_KEY = process.env.GENERAL_IDENTITY_GRAPH_API_KEY || "";

export async function middleware(req: NextRequest) {
  const clientIp = extractClientIp(req);
  const shouldSetClientIp =
    clientIp !== "unknown" && req.headers.get("x-client-ip") !== clientIp;
  const shouldSetApiKey = !!GENERAL_KEY && !req.headers.has("x-api-key");

  if (!shouldSetClientIp && !shouldSetApiKey) {
    return NextResponse.next();
  }

  const userHeaders = new Headers(req.headers);
  if (shouldSetClientIp) {
    userHeaders.set("x-client-ip", clientIp);
  }
  if (shouldSetApiKey) {
    userHeaders.set("x-api-key", GENERAL_KEY);
  }

  return NextResponse.next({
    request: {
      headers: userHeaders,
    },
  });
}
