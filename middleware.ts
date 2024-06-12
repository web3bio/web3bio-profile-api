import { NextResponse } from "next/server";
import { regexSolana } from "./utils/regexp";

export const config = {
  matcher: ["/(ns|profile|avatar)/(.*(?:[A-Z]+).*)"],
};

export function middleware(req: {
  nextUrl: { pathname: string; clone: () => URL };
}) {
  const identity = req.nextUrl.pathname.split("/").pop() || "";
  console.log("Middleware: ", identity)
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
