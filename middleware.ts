import { jwtVerify } from "jose";
import { type NextRequest, NextResponse } from "next/server";
import { handleSearchPlatform, isValidEthereumAddress } from "./utils/base";

async function verifyAuth(token: string) {
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_KEY),
    );
    return payload;
  } catch (err) {
    throw new Error("Invalid API Token");
  }
}

const getIdentityPlatform = (req: NextRequest) => {
  const { searchParams, pathname } = req.nextUrl;
  let identity = null;
  let platform = null;

  if (pathname.startsWith("/graph")) {
    identity = searchParams.get("identity");
    platform = searchParams.get("platform");
  } else if (pathname.startsWith("/domains")) {
    identity = searchParams.get("name");
    platform = "domains";
  } else if (pathname.includes("/batch")) {
    identity = JSON.stringify(searchParams.get("ids"));
    platform = "batch";
  } else {
    const pathArr = pathname.split("/");
    platform =
      pathArr.length === 4
        ? pathArr[2]
        : handleSearchPlatform(pathArr[pathArr.length - 1]);
    identity = pathArr[pathArr.length - 1];
  }

  return { identity, platform };
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
  const customHeaders = {
    "X-Client-IP": req.headers.get("x-client-ip") || "anonymous",
    "X-API-KEY": req.headers.get("x-api-key") || "",
  };

  console.log(
    JSON.stringify({
      message: "Incoming request",
      url: req.url,
      headers: customHeaders,
      timestamp: new Date().toISOString(),
    }),
  );
  const verifiedToken = await verifyAuth(
    userToken.replace("Bearer ", ""),
  ).catch((err) => {
    console.error(err.message);
  });

  if (!verifiedToken) {
    const { identity, platform } = getIdentityPlatform(req);

    return NextResponse.json(
      {
        address: identity && isValidEthereumAddress(identity) ? identity : null,
        identity,
        platform,
        error: "Invalid API Token",
      },
      { status: 403 },
    );
  }
}
