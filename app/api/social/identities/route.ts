import type { NextRequest } from "next/server";
import { errorHandle } from "@/utils/utils";
import { lookupAssociatedAccounts } from "./utils";

export async function POST(req: NextRequest) {
  let body;
  try {
    let bytes = 0;
    body = await new Response(
      req.body?.pipeThrough(new TransformStream({
        transform(chunk, controller) {
          bytes += chunk.byteLength;
          if (bytes > 64 * 1024) throw new RangeError("Request body too large");
          controller.enqueue(chunk);
        },
      })),
    ).json();
  } catch (error) {
    return errorHandle({
      identity: "",
      path: req.nextUrl.pathname,
      platform: null,
      code: error instanceof RangeError ? 413 : 400,
      message: error instanceof RangeError ? error.message : "Invalid JSON body",
    });
  }
  return lookupAssociatedAccounts(req, body?.queryIds);
}
