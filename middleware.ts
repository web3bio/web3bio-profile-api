import { type NextRequest, NextResponse } from "next/server";
import { getClientIP } from "./utils/utils";

export const config = {
  matcher: [
    "/avatar/:path*",
    "/domain/:path*",
    "/ns/:path*",
    "/profile/:path*",
    "/credential/:path*",
    "/search/:path*",
  ],
};

const GENERAL_KEY = process.env.GENERAL_IDENTITY_GRAPH_API_KEY || "";

export async function middleware(req: NextRequest) {
  const userHeaders = new Headers(req.headers);

  // Set client IP if available
  const ip = getClientIP(req);
  if (ip && ip !== "unknown") {
    userHeaders.set("x-client-ip", ip);
  }

  // If no API key provided, set general key
  if (!userHeaders.has("x-api-key")) {
    userHeaders.set("x-api-key", GENERAL_KEY);
  }

  return NextResponse.next({
    request: {
      headers: userHeaders,
    },
  });
}
