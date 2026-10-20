import { type NextRequest, NextResponse } from "next/server";
import { extractClientIp } from "@/utils/ip";

export const config = {
  matcher: [
    "/(avatar|domain|ns|profile|credential|search|socialGraph|wallet|partner)/:path*",
  ],
};

const GENERAL_KEY = process.env.GENERAL_IDENTITY_GRAPH_API_KEY || "";

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const toSns = (value: string) =>
    value.replace(/^((?:sns,)?[^,]+)\.sol$/i, "$1.sns");
  const separator = url.pathname.lastIndexOf("/");
  try {
    const handle = decodeURIComponent(url.pathname.slice(separator + 1));
    const normalized = url.pathname.includes("/batch/")
      ? JSON.stringify(JSON.parse(handle).map(toSns))
      : toSns(handle);
    if (normalized !== handle) {
      url.pathname =
        url.pathname.slice(0, separator + 1) + encodeURIComponent(normalized);
    }
  } catch {}
  const shouldRewrite = url.href !== req.nextUrl.href;
  const clientIp = extractClientIp(req);
  const headers = req.headers;
  const shouldSetClientIp =
    clientIp !== "unknown" && headers.get("x-client-ip") !== clientIp;
  const shouldSetApiKey = GENERAL_KEY !== "" && !headers.has("x-api-key");

  if (!(shouldSetClientIp || shouldSetApiKey || shouldRewrite)) {
    return NextResponse.next();
  }

  const userHeaders = new Headers(headers);
  if (shouldSetClientIp) {
    userHeaders.set("x-client-ip", clientIp);
  }
  if (shouldSetApiKey) {
    userHeaders.set("x-api-key", GENERAL_KEY);
  }

  if (shouldRewrite) {
    return NextResponse.rewrite(url, { request: { headers: userHeaders } });
  }
  return NextResponse.next({ request: { headers: userHeaders } });
}
