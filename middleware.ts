import { NextResponse } from "next/server";
import { regexSolana } from "./utils/regexp";

export const config = {
  matcher: ["/ns/:path*", "/profile/:path*"],
};

export function middleware(req: {
  nextUrl: { pathname: string; clone: () => URL };
}) {
  const identity = req.nextUrl.pathname.split("/").pop() || "";
  if (
    req.nextUrl.pathname !== req.nextUrl.pathname.toLowerCase() &&
    !regexSolana.test(identity)
  ) {
    const url = req.nextUrl.clone();
    url.pathname = url.pathname.toLowerCase();
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}
