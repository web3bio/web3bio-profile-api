import { ErrorMessages, Platform } from "web3bio-profile-kit/types";
import { errorHandle, respondJson } from "@/utils/utils";

describe("x-request-platform header", () => {
  it("sets a known platform and ignores unsafe values", () => {
    const ok = errorHandle({
      identity: "vitalik.eth",
      path: "/profile/ens/vitalik.eth",
      platform: Platform.ens,
      code: 404,
      message: ErrorMessages.INVALID_IDENTITY,
    });
    expect(ok.headers.get("x-request-platform")).toBe("ens");

    const unsafe = errorHandle({
      identity: "vitalik.eth",
      path: "/profile/ens/vitalik.eth",
      platform: "ens\r\nX-Injected: 1" as Platform,
      code: 404,
      message: ErrorMessages.INVALID_IDENTITY,
    });
    expect(unsafe.status).toBe(404);
    expect(unsafe.headers.get("x-request-platform")).toBeNull();

    const unknown = respondJson({ identity: "dwr" }, "not-a-platform" as Platform);
    expect(unknown.status).toBe(200);
    expect(unknown.headers.get("x-request-platform")).toBeNull();
  });
});
