import type { NextApiRequest } from "next";
import { errorHandle, ErrorMessages } from "@/utils/base";
import { PlatformType } from "@/utils/platform";
import { regexEns, regexEth, regexTwitter } from "@/utils/regexp";

interface RequestInterface extends NextApiRequest {
  nextUrl: {
    origin: string;
  };
}

const respondWithCache = (json: string) => {
  return new Response(json, {
    status: 200,
    headers: {
      "Cache-Control": `public, s-maxage=${
        60 * 60 * 24 * 7
      }, stale-while-revalidate=${60 * 30}`,
    },
  });
};

export const resolveTwitterAndETH = async (twitterHandle: string) => {
  const endPoint = `https://7x16bogxfb.execute-api.us-east-1.amazonaws.com/v1/identity?identity=${twitterHandle}&platform=twitter&size=20&page=1`;
  const response = await fetch(endPoint).then((res) => res.json());
  return response?.records?.find((x: any) => x.sns_handle === twitterHandle)
    ?.web3_addr;
};

const resolveTwitterResponse = async (
  handle: string,
  req: RequestInterface
) => {
  const ethAddress = await resolveTwitterAndETH(handle);
  const obj = await Promise.all([
    fetch(req.nextUrl.origin + `/api/profile/twitter/${handle}`).then((res) =>
      res.json()
    ),
    fetch(req.nextUrl.origin + `/api/profile/ens/${ethAddress}`).then((res) =>
      res.json()
    ),
    fetch(req.nextUrl.origin + `/api/profile/farcaster/${ethAddress}`).then(
      (res) => res.json()
    ),
    fetch(req.nextUrl.origin + `/api/profile/lens/${ethAddress}`).then((res) =>
      res.json()
    ),
  ])
    .then((responses) => {
      return {
        total: responses.length,
        results: responses,
      };
    })
    .catch((error) => {
      return errorHandle({
        address: null,
        identity: handle,
        code: 500,
        message: error as any,
        platform: PlatformType.nextid,
      });
    });
  return respondWithCache(JSON.stringify(obj));
};

const resolveUniversalHandle = async (
  handle: string,
  req: RequestInterface
) => {
  if (regexTwitter.test(handle)) {
    return await resolveTwitterResponse(handle, req);
  }

  return errorHandle({
    address: null,
    identity: handle,
    platform: PlatformType.nextid,
    message: ErrorMessages.unknownError,
    code: 500,
  });
};

export default async function handler(req: RequestInterface) {
  const { searchParams } = new URL(req.url as string);
  const inputName = searchParams.get("handle");
  const lowercaseName = inputName?.toLowerCase() || "";
  if (!lowercaseName)
    return errorHandle({
      address: null,
      identity: lowercaseName,
      platform: PlatformType.twitter,
      code: 404,
      message: ErrorMessages.invalidIdentity,
    });
  return resolveUniversalHandle(lowercaseName, req);
}

export const config = {
  runtime: "edge",
};
