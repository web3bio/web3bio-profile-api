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

const GENERAL_KEY = process.env.GENERAL_IDENTITY_GRAPH_API_KEY || "";

function initHeaders(req: NextRequest) {
  const userHeaders = new Headers(req.headers);
  let ip =
    userHeaders?.get("x-forwarded-for") ||
    userHeaders?.get("x-real-ip") ||
    req.ip;

  if (ip && ip.includes(",")) {
    ip = ip.split(",")[1].trim();
  }
  if (ip && ip.length > 0) {
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

export async function middleware(req: NextRequest) {
  const userHeaders = initHeaders(req);
  const userToken = userHeaders.get("x-api-key");
  if (!userToken) {
    userHeaders.set("x-api-key", GENERAL_KEY);

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
    logWithInfo(userToken);
    return NextResponse.next({
      request: {
        headers: userHeaders,
      },
    });
  }
}
