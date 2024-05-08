import { NextRequest } from "next/server";

export const runtime = "nodejs";
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const url = searchParams.get("url");

  return new Response(url);
}
