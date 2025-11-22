import { jwtVerify } from "jose";
import { type NextRequest, NextResponse } from "next/server";

async function verifyAuth(token: string) {
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_KEY),
    );
    return payload;
  } catch {
    return null;
  }
}

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

function getClientIP(req: NextRequest): string {
  let ip =
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip");
  if (ip && ip.includes(",")) {
    ip = ip.split(",")[1].trim();
  }
  console.log("IP: ", ip);
  return ip || "unknown";
}

function initHeaders(req: NextRequest) {
  const userHeaders = new Headers(req.headers);
  const ip = getClientIP(req);
  if (ip && ip !== "unknown") {
    userHeaders.set("x-client-ip", ip);
  }
  return userHeaders;
}

function logWithInfo(token: string) {
  const message: {
    key: string;
    params?: string;
  } = {
    key: token?.replace("Bearer ", ""),
  };
  return console.log(JSON.stringify(message));
}

export async function middleware(req: NextRequest, env?: any) {
  const userToken = req.headers.get("x-api-key");

  if (userToken) {
    const verifiedToken = await verifyAuth(userToken.replace("Bearer ", ""));
    if (verifiedToken) {
      // Valid API key, proceed without rate limiting
      const userHeaders = initHeaders(req);
      userHeaders.set("x-api-key", userToken);
      logWithInfo(userToken);
      return NextResponse.next({
        request: {
          headers: userHeaders,
        },
      });
    }
  }

  // Rate limiting for unauthenticated or invalid API key
  const clientIP = getClientIP(req);
  if (env && env.API_RATE_LIMIT) {
    const { success } = await env.API_RATE_LIMIT.limit({ key: clientIP });
    if (!success) {
      return new Response("429 Too Many Requests", { status: 429 });
    }
  }

  const userHeaders = initHeaders(req);
  if (!userToken) {
    userHeaders.set("x-api-key", GENERAL_KEY);

    return NextResponse.next({
      request: {
        headers: userHeaders,
      },
    });
  }

  // Invalid token
  return NextResponse.json(
    {
      address: null,
      identity: null,
      platform: null,
      error: "Invalid API Token",
    },
    { status: 403 },
  );
}
