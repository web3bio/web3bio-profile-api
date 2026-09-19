import { NextRequest } from "next/server";
import { GET } from "../app/api/avatar/[handle]/route";
import { queryIdentityGraph } from "../utils/query";
import { resolveWithIdentityGraph } from "../app/api/profile/[handle]/utils";
import { Platform } from "web3bio-profile-kit/types";

jest.mock("../utils/query", () => ({
  queryIdentityGraph: jest.fn(),
  QueryType: { GET_PROFILES_NS: "GET_PROFILES_NS" },
}));
jest.mock("../app/api/profile/[handle]/utils", () => ({
  resolveWithIdentityGraph: jest.fn(),
}));

describe("Avatar response compatibility", () => {
  const request = () =>
    GET(new NextRequest("https://api.web3.bio/avatar/alice.eth"), {
      params: Promise.resolve({ handle: "alice.eth" }),
    });

  const setAvatar = (avatar: string) =>
    jest.mocked(resolveWithIdentityGraph).mockResolvedValue([
      {
        identity: "alice.eth",
        platform: Platform.ens,
        address: "0x0000000000000000000000000000000000000001",
        displayName: "Alice",
        description: null,
        header: null,
        status: null,
        avatar,
      },
    ]);

  beforeEach(() => {
    jest.mocked(queryIdentityGraph).mockResolvedValue({});
  });

  afterEach(() => jest.restoreAllMocks());

  it("preserves error status and payload while preventing error caching", async () => {
    const error = {
      identity: "alice.eth",
      platform: Platform.ens,
      message: "Not Found",
      code: 404,
    };
    jest.mocked(resolveWithIdentityGraph).mockResolvedValue(error);
    const response = await request();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(error);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("preserves a normal redirect and bounds the HEAD probe", async () => {
    setAvatar("https://images.example/avatar.png");
    const fetchMock = jest.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { headers: { "Content-Type": "image/png" } }),
    );
    const response = await request();
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://images.example/avatar.png",
    );
    expect(fetchMock.mock.calls[0][1]?.signal).toBeInstanceOf(AbortSignal);
  });

  it("preserves the original redirect when HEAD times out", async () => {
    setAvatar("https://images.example/avatar.png");
    jest
      .spyOn(globalThis, "fetch")
      .mockRejectedValue(new DOMException("Timed out", "TimeoutError"));
    const response = await request();
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://images.example/avatar.png",
    );
  });

  it("keeps WebP conversion without a redundant HEAD request", async () => {
    setAvatar("https://images.example/avatar.webp");
    const fetchMock = jest.spyOn(globalThis, "fetch");
    const response = await request();
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://images.web3.bio/?url=https%3A%2F%2Fimages.example%2Favatar.webp&og",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
