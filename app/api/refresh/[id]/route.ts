import { type NextRequest, NextResponse } from "next/server";
import type { Platform } from "web3bio-profile-kit/types";
import { QueryType, queryIdentityGraph } from "@/utils/query";
import { getUserHeaders } from "@/utils/utils";

const badRequest = (message: string) =>
  NextResponse.json({ message }, { status: 400 });

const serverError = (error: string) =>
  NextResponse.json({ error }, { status: 500 });

type ParsedRevalidateId =
  | { id: string; platform: Platform; identity: string }
  | { error: string };

const parseRevalidateId = (
  id: string | undefined,
): ParsedRevalidateId => {
  if (!id || typeof id !== "string") {
    return { error: "Missing or invalid id parameter" };
  }

  const [platform, identity, ...rest] = id.split(",");
  if (rest.length > 0 || !platform?.trim() || !identity?.trim()) {
    return { error: "Invalid id format. Expected: platform,identity" };
  }

  return {
    id,
    platform: platform.trim() as Platform,
    identity: identity.trim(),
  };
};

// e.g `https://api.web3.bio/revalidate/ens,sujiyan.eth`
export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const { id } = await props.params;
  const parsedId = parseRevalidateId(id);
  if ("error" in parsedId) {
    return badRequest(parsedId.error);
  }

  try {
    const headers = getUserHeaders(req.headers);
    const res = await queryIdentityGraph(
      QueryType.GET_REFRESH_PROFILE,
      parsedId.identity,
      parsedId.platform,
      headers,
    );

    if (res?.errors) {
      return serverError(String(res.errors));
    }

    const refreshed = res?.data?.identity;
    if (!refreshed) {
      return serverError("Failed to refresh profile data");
    }

    return NextResponse.json({
      id: parsedId.id,
      status: refreshed.status,
      now: new Date().toISOString(),
    });
  } catch (error) {
    return serverError("Internal server error");
  }
}
