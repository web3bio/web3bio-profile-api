import { handleSearchPlatform, shouldPlatformFetch } from "@/utils/base";
import { NextRequest } from "next/server";
import { resolveUniversalRespondFromRelation } from "../../profile/[handle]/utils";
import { respondWithBoringSVG } from "../svg/utils";
import type * as WasmModule from "@/constants/magick.wasm";
// @ts-ignore
import Wasm from "@/constants/magick.wasm?module";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const name = searchParams.get("handle") || "";
  const platform = handleSearchPlatform(name);
  if (shouldPlatformFetch(platform)) {
    const profiles = (await resolveUniversalRespondFromRelation({
      platform,
      handle: name,
      req,
      ns: true,
    })) as any;

    if (profiles?.length > 0) {
      const avatarURL = profiles?.find((x: any) => !!x.avatar)?.avatar;
      const arrayBuffer = await fetch(avatarURL)
        .then((res) => res.arrayBuffer())
        .catch(() => null);
      if (arrayBuffer) {
        const instance = (await WebAssembly.instantiate(Wasm)) as any;
        const exports = instance.exports as typeof WasmModule;
        exports.ImageMagick.read(avatarURL, (image) => {
          image.resize(120, 120);
          image.write(exports.MagickFormat.Png, (data) => {
            console.log(data, "imageData");
          });
        });
        return new Response(arrayBuffer, {
          headers: {
            "Content-Type": "image/png",
          },
        });
      }
    }
  }
  return respondWithBoringSVG(name, 240);
}

export const runtime = "edge";
