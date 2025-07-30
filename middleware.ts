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
    "/stats/:path*",
    "/domain/:path*",
    "/ns/:path*",
    "/profile/:path*",
    "/credentials/:path*",
  ],
};

const WEB3BIO_KEY = process.env.WEB3BIO_IDENTITY_GRAPH_API_KEY || "";
const GENERAL_KEY = process.env.GENERAL_IDENTITY_GRAPH_API_KEY || "";

function initHeaders(req: NextRequest) {
  // init x-client-ip
  const userHeaders = new Headers(req.headers);
  let ip = userHeaders?.get("x-forwarded-for") || req?.ip;

  if (ip && ip.includes(",")) {
    // resolve ipv6 to ipv4
    ip = ip.split(",")[0].trim();
  }
  if (ip && ip.length > 0) {
    userHeaders.set("x-client-ip", ip);
  }
  return userHeaders;
}

function logWithInfo(req: NextRequest, token: string) {
  const { pathname, search } = req.nextUrl;
  const message: {
    key: string;
    params?: string;
  } = {
    key: token?.replace("Bearer ", ""),
  };
  if (["/search"].includes(pathname)) {
    message.params = search.replace("?", "");
  }
  return console.log(JSON.stringify(message));
}

export async function middleware(req: NextRequest) {
  const userHeaders = initHeaders(req);
  const isTrusted = userHeaders.get("origin")?.endsWith("web3.bio");
  const userToken = userHeaders.get("x-api-key");
  if (!userToken) {
    // request from *.web3.bio set x-api-key as WEB3BIO_KEY or GENERAL_KEY
    userHeaders.set("x-api-key", isTrusted ? WEB3BIO_KEY : GENERAL_KEY);
    if (isTrusted) {
      logWithInfo(req, WEB3BIO_KEY);
    }
    return NextResponse.next({
      request: {
        headers: userHeaders,
      },
    });
  }

  const verifiedToken = await verifyAuth(userToken.replace("Bearer ", ""));

  if (!verifiedToken) {
    return NextResponse.json(
      {
        address: null,
        identity: null,
        platform: null,
        error: "Invalid API Token",
      },
      { status: 403 },
    );
  } else {
    logWithInfo(req, userToken);
    return NextResponse.next({
      request: {
        headers: userHeaders,
      },
    });
  }
}
