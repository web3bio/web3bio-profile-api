import { GET } from "@/app/api/avatar/[handle]/route";
import { NextRequest } from "next/server";

describe("Test For Avatar Service API", () => {
  it("It should response 200 for vitalik.eth", async () => {
    const req = {
      nextUrl: {
        searchParams: new URLSearchParams({ handle: "vitalik.eth" }),
      },
    } as NextRequest;
    const res = await GET(req);
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text.startsWith("https"));
  });
  it("It should response 200 for bonfida.sol", async () => {
    const req = {
      nextUrl: {
        searchParams: new URLSearchParams({ handle: "bonfida.sol" }),
      },
    } as NextRequest;
    const res = await GET(req);
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text.startsWith("<svg"));
  });
  it("It should response 200 for xxxxx.xxxxx", async () => {
    const req = {
      nextUrl: {
        searchParams: new URLSearchParams({ handle: "xxxxx.xxxxx" }),
      },
    } as NextRequest;
    const res = await GET(req);
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text.startsWith("<svg"));
  });
  it("It should response 200 for 46YaTaa8Xa1xFEVDxPa4CVJpzsNADocgixS51HLNCS4Y", async () => {
    const req = {
      nextUrl: {
        searchParams: new URLSearchParams({
          handle: "46YaTaa8Xa1xFEVDxPa4CVJpzsNADocgixS51HLNCS4Y",
        }),
      },
    } as NextRequest;
    const res = await GET(req);
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text.startsWith("https"));
  });
});
