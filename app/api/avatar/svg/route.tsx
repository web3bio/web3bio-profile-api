// Code from Boring Avatars https://github.com/boringdesigners/boring-avatars
// Demo: /avatar/svg?handle=vitalik.eth
import { NextRequest } from "next/server";
import { respondWithSVG } from "./utils";
import { isValidEthereumAddress } from "@/utils/base";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const name = searchParams.get("handle") || "";
  const size = searchParams.get("size") || 240;
  return await respondWithSVG(
    isValidEthereumAddress(name) ? name.toLowerCase() : name,
    Number(size),
  );
}
export const runtime = "edge";
