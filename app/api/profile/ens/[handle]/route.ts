import { NextRequest } from "next/server";
import { resolveENSRespond } from "./utils";
import { ParamsType } from "@/utils/types";

export async function GET(req: NextRequest, { params }: ParamsType) {
  const lowercaseName = params?.handle?.toLowerCase();
  return resolveENSRespond(lowercaseName);
}

export const runtime = "edge";
