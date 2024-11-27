import { jwtVerify } from "jose";
import { type NextRequest, NextResponse } from "next/server";
import { handleSearchPlatform, isValidEthereumAddress } from "./utils/base";

async function verifyAuth(token: string) {
  try {
    const verified = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_KEY)
    );
    console.log(verified, "verified");
    return verified.payload;
  } catch (err) {
    throw new Error("Invalid API Token");
  }
}

const getIdentityPlatform = (req: NextRequest) => {
  let identity,
    platform = null;
  const { searchParams } = req.nextUrl;
  const pathname = req.nextUrl.pathname;

  if (pathname.startsWith("/graph")) {
    identity = searchParams.get("identity");
    platform = searchParams.get("platform");
  }
  if (pathname.startsWith("/domains")) {
    identity = searchParams.get("name");
    platform = "domains";
  }
  if (pathname.includes("/batch")) {
    identity = JSON.stringify(searchParams.get("ids"));
    platform = "batch";
  }
  const pathArr = pathname.split("/");
  platform =
    pathArr.length === 4
      ? pathname.split("/")[2]
      : handleSearchPlatform(pathArr[pathArr.length - 1]);
  identity = pathArr[pathArr.length - 1];

  return {
    identity,
    platform,
  };
};

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
  const verifiedToken = await verifyAuth(userToken).catch((err) => {
    // todo: do some log
    console.error(err.message);
  });

  if (!verifiedToken) {
    const { identity, platform } = getIdentityPlatform(req);

    return new NextResponse(
      JSON.stringify({
        address: identity && isValidEthereumAddress(identity) ? identity : null,
        identity,
        platform,
        error: "Invalid API Token",
      }),
      { status: 403 }
    );
  }
}
