import { type NextRequest, NextResponse } from "next/server";
import { getClientIP } from "./utils/utils";

export const config = {
  matcher: [
    "/avatar/:path*",
    "/domain/:path*",
    "/ns/:path*",
    "/profile/:path*",
    "/credential/:path*",
  ],
};

const GENERAL_KEY = process.env.GENERAL_IDENTITY_GRAPH_API_KEY || "";

function initHeaders(req: NextRequest) {
  const userHeaders = new Headers(req.headers);
  const ip = getClientIP(req);
  if (ip && ip !== "unknown") {
    userHeaders.set("x-client-ip", ip);
  }
  return userHeaders;
}

export async function middleware(req: NextRequest) {
  const userToken = req.headers.get("x-api-key");
  const userHeaders = initHeaders(req);

  // If no API key provided, set general key
  if (!userToken) {
    userHeaders.set("x-api-key", GENERAL_KEY);
  }

  return NextResponse.next({
    request: {
      headers: userHeaders,
    },
  });
}
