import { type NextRequest, NextResponse } from "next/server";
import type { Platform } from "web3bio-profile-kit/types";
import { QueryType, queryIdentityGraph } from "@/utils/query";
import { getUserHeaders } from "@/utils/utils";

// e.g `https://api.web3.bio/revalidate/ens,sujiyan.eth`
export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;
  try {
    const { id } = params;

    // Validate id parameter
    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { message: "Missing or invalid id parameter" },
        { status: 400 },
      );
    }

    // Parse platform and identity from id
    const parts = id.split(",");
    if (parts.length !== 2) {
      return NextResponse.json(
        { message: "Invalid id format. Expected: platform,identity" },
        { status: 400 },
      );
    }

    const [platform, identity] = parts;

    // Validate parsed data
    if (!platform.trim() || !identity.trim()) {
      return NextResponse.json(
        { message: "Platform and identity cannot be empty" },
        { status: 400 },
      );
    }

    // Get user headers
    const headers = getUserHeaders(req.headers);

    // Query identity graph
    const res = await queryIdentityGraph(
      QueryType.GET_REFRESH_PROFILE,
      identity.trim(),
      platform.trim() as Platform,
      headers,
    );

    // Handle response errors
    if (res?.errors) {
      return NextResponse.json({ error: res.errors }, { status: 500 });
    }

    const refreshed = res?.data?.identity;
    if (!refreshed) {
      return NextResponse.json(
        { error: "Failed to refresh profile data" },
        { status: 500 },
      );
    }

    // Return success response
    return NextResponse.json({
      id,
      status: refreshed.status,
      now: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Revalidate API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
