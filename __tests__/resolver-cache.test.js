describe("NFT asset resolution", () => {
  const originalOpenSeaKey = process.env.OPENSEA_API_KEY;
  const originalAlchemyKey = process.env.ALCHEMY_NFT_API_KEY;
  const asset = (id) =>
    `eip155:1/erc721:0x0000000000000000000000000000000000000001/${id}`;
  let resolveEipAssetURL;
  let fetchMock;

  beforeEach(() => {
    jest.resetModules();
    ({ resolveEipAssetURL } = require("../utils/resolver"));
    process.env.OPENSEA_API_KEY = "test-opensea";
    process.env.ALCHEMY_NFT_API_KEY = "test-alchemy";
    fetchMock = jest.spyOn(globalThis, "fetch").mockImplementation(async () =>
      Response.json({ nft: { image_url: "https://images.example/nft.png" } }),
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
    if (originalOpenSeaKey === undefined) delete process.env.OPENSEA_API_KEY;
    else process.env.OPENSEA_API_KEY = originalOpenSeaKey;
    if (originalAlchemyKey === undefined) delete process.env.ALCHEMY_NFT_API_KEY;
    else process.env.ALCHEMY_NFT_API_KEY = originalAlchemyKey;
  });

  it("reuses completed NFT results without caching ordinary URLs", async () => {
    const result = await resolveEipAssetURL(asset(1));
    for (let id = 0; id < 300; id++) {
      const url = `https://images.example/${id}.png`;
      expect(await resolveEipAssetURL(url)).toBe(url);
    }
    expect(await resolveEipAssetURL(asset(1))).toBe(result);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(await resolveEipAssetURL(null)).toBeNull();
    expect(fetchMock.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
  });

  it("refreshes expired results", async () => {
    let now = Date.now();
    jest.spyOn(Date, "now").mockImplementation(() => now);
    await resolveEipAssetURL(asset(1));
    now += 5 * 60 * 1000 + 1;
    fetchMock.mockResolvedValueOnce(
      Response.json({ nft: { image_url: "https://images.example/updated.png" } }),
    );
    expect(await resolveEipAssetURL(asset(1))).toBe(
      "https://images.example/updated.png",
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("evicts old entries when capacity is reached", async () => {
    for (let id = 0; id < 257; id++) {
      await resolveEipAssetURL(asset(id));
    }
    await resolveEipAssetURL(asset(256));
    expect(fetchMock).toHaveBeenCalledTimes(257);
    await resolveEipAssetURL(asset(0));
    expect(fetchMock).toHaveBeenCalledTimes(258);
  });

  it("does not share pending I/O between independent calls", async () => {
    const releases = [];
    fetchMock.mockImplementation(
      () => new Promise((resolve) => releases.push(resolve)),
    );
    const first = resolveEipAssetURL(asset(1));
    const second = resolveEipAssetURL(asset(1));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    releases.forEach((resolve) =>
      resolve(Response.json({ nft: { image_url: "https://images.example/nft.png" } })),
    );
    expect(await Promise.all([first, second])).toEqual([
      "https://images.example/nft.png",
      "https://images.example/nft.png",
    ]);
  });

  it("keeps the Alchemy fallback when OpenSea times out", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    fetchMock.mockRejectedValueOnce(new DOMException("Timed out", "TimeoutError"));
    fetchMock.mockResolvedValueOnce(
      Response.json({ image: { cachedUrl: "https://images.example/alchemy.png" } }),
    );
    expect(await resolveEipAssetURL(asset(1))).toBe(
      "https://images.example/alchemy.png",
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][1].signal).toBeInstanceOf(AbortSignal);
  });
});
