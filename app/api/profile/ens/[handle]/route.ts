import { NextRequest } from "next/server";
import { resolveENSRespond } from "./utils";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const inputName = searchParams.get("handle") || "";
  const lowercaseName = inputName?.toLowerCase();
  return resolveENSRespond(lowercaseName);
}

export const runtime = "edge";
