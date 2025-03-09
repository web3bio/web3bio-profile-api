// Demo: /avatar/svg/ens,vitalik.eth
import { NextRequest } from "next/server";
import { respondWithSVG } from "./utils";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const name = searchParams.get("handle") || "";

  return await respondWithSVG(name, Number(240));
}
export const runtime = "edge";
