import type { NextApiRequest } from "next";
import {
  errorHandle,
  ErrorMessages,
  isValidEthereumAddress,
  respondWithCache,
} from "@/utils/base";
import { PlatformData, PlatformType } from "@/utils/platform";
import { regexEth, regexUnstoppableDomains } from "@/utils/regexp";
import { getSocialMediaLink, resolveHandle } from "@/utils/resolver";
import { resolveIPFS_URL } from "@/utils/ipfs";

export const config = {
  runtime: "edge",
  regions: ["sfo1", "iad1", "pdx1"],
};

const UDSocialAccountsList = [
  PlatformType.twitter,
  PlatformType.discord,
  PlatformType.reddit,
  PlatformType.lens,
  PlatformType.telegram,
  PlatformType.youtube,
];

const UDBaseEndpoint = "https://api.unstoppabledomains.com/";
const UDProfileEndpoint = "https://profile.unstoppabledomains.com/api/public/";

const fetchUDBase = async (path: string) => {
  return fetch(UDBaseEndpoint + path, {
    method: "GET",
    headers: {
      Authorization: process.env.NEXT_PUBLIC_UD_API_KEY || "",
    },
  }).then((res) => res.json());
};
const fetchUDProfile = async (domain: string) => {
  return fetch(
    `${UDProfileEndpoint}/${domain}?fields=profile,records,socialAccounts`,
    {
      method: "GET",
    }
  ).then((res) => res.json());
};

export const resolveUDResponse = async (handle: string) => {
  let address;
  let domain;
  if (isValidEthereumAddress(handle)) {
    const res = await fetchUDBase(`resolve/reverse/${handle}`);
    if (!res?.meta) {
      throw new Error(ErrorMessages.notFound, { cause: 404 });
    }
    address = handle;
    domain = res.meta.domain;
  } else {
    const res = await fetchUDBase(`resolve/domains/${handle}`);

    if (!res?.meta) {
      throw new Error(ErrorMessages.notFound, { cause: 404 });
    }
    domain = res.meta.domain || handle;
    address = res.meta.owner.toLowerCase();
  }
  const metadata = await fetchUDProfile(domain);

  return { address, domain, metadata };
};
export const resolveUDHandle = async (handle: string) => {
  const { address, domain, metadata } = await resolveUDResponse(handle);
  const LINKRES: {
    [key in PlatformType]?: {
      link: string | null;
      handle: string | null;
    };
  } = {};
  if (metadata.profile.web2Url) {
    LINKRES[PlatformType.website] = {
      handle: resolveHandle(metadata.profile?.web2Url),
      link: getSocialMediaLink(metadata.profile?.web2Url, PlatformType.website),
    };
  }
  if (metadata.records?.["ipfs.html.value"]) {
    LINKRES[PlatformType.url] = {
      handle: domain,
      link: resolveIPFS_URL(metadata.records?.["ipfs.html.value"]) || null,
    };
  }
  if (metadata.socialAccounts) {
    UDSocialAccountsList.forEach((x) => {
      const item = metadata.socialAccounts[x];
      if (item && item.location && PlatformData[x]) {
        const resolvedHandle = resolveHandle(item?.location, x);
        LINKRES[x] = {
          handle: resolvedHandle,
          link: getSocialMediaLink(resolvedHandle, x),
        };
      }
    });
  }
  return {
    address,
    identity: domain,
    platform: PlatformType.unstoppableDomains,
    displayName: metadata.profile.displayName || handle,
    avatar:
      metadata.profile.imageType === "default"
        ? null
        : metadata.profile.imagePath || null,
    description: metadata.profile.description || null,
    email: metadata.profile.publicDomainSellerEmail || null,
    location: metadata.profile.location || null,
    header: metadata.profile.coverPath || null,
    contenthash: LINKRES.url?.link
      ? `ipfs://${metadata.records?.["ipfs.html.value"]}`
      : null,
    links: LINKRES,
  };
};

const resolveUDRespond = async (handle: string) => {
  try {
    const json = await resolveUDHandle(handle);
    return respondWithCache(JSON.stringify(json));
  } catch (e: any) {
    return errorHandle({
      identity: handle,
      platform: PlatformType.unstoppableDomains,
      code: e.cause || 500,
      message: e.message,
    });
  }
};

export default async function handler(req: NextApiRequest) {
  const { searchParams } = new URL(req.url as string);
  const inputName = searchParams.get("handle");
  const lowercaseName = inputName?.toLowerCase() || "";

  if (
    !regexUnstoppableDomains.test(lowercaseName) &&
    !regexEth.test(lowercaseName)
  )
    return errorHandle({
      identity: lowercaseName,
      platform: PlatformType.unstoppableDomains,
      code: 404,
      message: ErrorMessages.invalidIdentity,
    });
  return resolveUDRespond(lowercaseName);
}
