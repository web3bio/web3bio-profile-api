import { jwtVerify } from "jose";
import { type NextRequest, NextResponse } from "next/server";

async function verifyAuth(token: string) {
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_KEY)
    );
    return payload;
  } catch {
    return null;
  }
}

export const config = {
  matcher: [
    "/domains/:path*",
    "/graph/:path*",
    "/ns/:path*",
    "/profile/:path*",
  ],
};

export async function middleware(req: NextRequest) {
  const userToken = req.headers.get("x-api-key");
  if (!userToken) {
    return NextResponse.next();
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
      { status: 403 }
    );
  }
}
