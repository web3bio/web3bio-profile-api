import {
  PLATFORMS_TO_EXCLUDE,
  errorHandle,
  formatText,
  handleSearchPlatform,
  isValidEthereumAddress,
  prettify,
  respondWithCache,
} from "@/utils/base";
import { PLATFORM_DATA, PlatformType } from "@/utils/platform";
import { GET_PROFILES, primaryDomainResolvedRequestArray } from "@/utils/query";
import { getSocialMediaLink, resolveHandle } from "@/utils/resolver";
import {
  ErrorMessages,
  ProfileAPIResponse,
  ProfileNSResponse,
  ProfileRecord,
} from "@/utils/types";
import { NextRequest } from "next/server";
import { ensRecordsDefaultOrShouldSkipText } from "../ens/[handle]/utils";
import { regexTwitterLink } from "@/utils/regexp";

export const NEXTID_GRAPHQL_ENDPOINT =
  process.env.NEXT_PUBLIC_GRAPHQL_SERVER || "https://graph.web3.bio/graphql";

function generateSocialLinks(data: ProfileRecord) {
  const platform = data.platform;
  const texts = data.texts;
  const keys = texts ? Object.keys(texts) : [];
  const identity = data.identity;
  const res = {} as any;
  switch (platform) {
    case PlatformType.ethereum:
    case PlatformType.ens:
      if (!texts) return {};
      let key = null;
      keys.forEach((i) => {
        if (!ensRecordsDefaultOrShouldSkipText.has(i)) {
          key = Array.from(PLATFORM_DATA.keys()).find((k) =>
            PLATFORM_DATA.get(k)?.ensText?.includes(i.toLowerCase())
          );
          if (key) {
            res[key] = {
              link: getSocialMediaLink(texts[i], key),
              handle: resolveHandle(texts[i]),
            };
          }
        }
      });
      break;
    case PlatformType.farcaster:
      const resolvedHandle = resolveHandle(identity);
      res[PlatformType.farcaster] = {
        links: getSocialMediaLink(resolvedHandle!, PlatformType.farcaster),
        handle: resolvedHandle,
      };
      const twitterMatch = data.description.match(regexTwitterLink);
      if (twitterMatch) {
        const matched = twitterMatch[1];
        const resolveMatch =
          resolveHandle(matched, PlatformType.farcaster) || "";
        res[PlatformType.twitter] = {
          link: getSocialMediaLink(resolveMatch, PlatformType.twitter),
          handle: resolveMatch,
        };
      }
      break;
    case PlatformType.lens:
      const pureHandle = identity.replace(".lens", "");
      res[PlatformType.lens] = {
        links: getSocialMediaLink(pureHandle!, PlatformType.lens),
        handle: pureHandle,
      };
      keys.forEach((i) => {
        if (Array.from(PLATFORM_DATA.keys()).includes(i as PlatformType)) {
          let key = null;
          key = Array.from(PLATFORM_DATA.keys()).find(
            (k) => k === i.toLowerCase()
          );
          if (key) {
            res[key] = {
              link: getSocialMediaLink(texts[i], i),
              handle: resolveHandle(texts[i]),
            };
          }
        }
      });
      break;

    // todo: remain to do
    case PlatformType.dotbit:
      break;
    case PlatformType.sns:
    case PlatformType.solana:
      break;
    case PlatformType.unstoppableDomains:
      break;
    default:
      break;
  }

  return res;
}

function generateProfileStruct(
  data: ProfileRecord,
  ns?: boolean
): ProfileAPIResponse | ProfileNSResponse {
  const nsObj = {
    address: data.address,
    identity: data.identity,
    platform: data.platform,
    displayName: data.displayName,
    avatar: data.avatar,
    description: data.description,
  };
  return ns
    ? nsObj
    : {
        ...nsObj,
        email: data.texts?.email || null,
        location: data.texts?.location || null,
        header: data.texts?.header || null,
        contenthash: data.contenthash || null,
        links: generateSocialLinks(data) || {},
        social: data.social || {},
      };
}

const DEFAULT_PLATFORM_ORDER = [
  PlatformType.ens,
  PlatformType.farcaster,
  PlatformType.lens,
  PlatformType.unstoppableDomains,
  PlatformType.ethereum,
];

async function resolveHandleFromRelationService(
  handle: string,
  platform: PlatformType = handleSearchPlatform(handle)!
): Promise<any> {
  try {
    const response = await fetch(NEXTID_GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        // Authorization: process.env.NEXT_PUBLIC_IDENTITY_GRAPH_API_KEY || "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: GET_PROFILES,
        variables: {
          identity: handle,
          platform,
        },
      }),
    });
    return await response.json();
  } catch (e) {
    return { errors: e };
  }
}

function sortProfilesByPlatform(
  responses: ProfileAPIResponse[] | ProfileNSResponse[],
  targetPlatform: PlatformType,
  handle: string
): ProfileAPIResponse[] {
  const order = DEFAULT_PLATFORM_ORDER.includes(targetPlatform)
    ? [
        targetPlatform,
        ...DEFAULT_PLATFORM_ORDER.filter((x) => x !== targetPlatform),
      ]
    : DEFAULT_PLATFORM_ORDER;

  const sortedResponses = responses.reduce(
    (acc, response) => {
      const { platform } = response;
      const index = order.indexOf(platform as PlatformType);
      if (index >= 0 && index < 5) {
        acc[index].push(response);
      }
      return acc;
    },
    Array.from({ length: 5 }, (_, i) =>
      i === 0
        ? [
            responses.find(
              (x) => x.identity === handle && x.platform === targetPlatform
            ),
          ]
        : []
    )
  );

  return sortedResponses.flat().filter(Boolean) as ProfileAPIResponse[];
}

export const resolveUniversalRespondFromRelation = async ({
  platform,
  handle,
  req,
  ns,
}: {
  platform: PlatformType;
  handle: string;
  req: NextRequest;
  ns?: boolean;
}) => {
  const responseFromRelation = await resolveHandleFromRelationService(
    handle,
    platform
  );
  console.log(responseFromRelation, "relation");
  if (responseFromRelation?.errors)
    return {
      identity: handle,
      platform,
      message: responseFromRelation?.errors[0]?.message,
      code: 500,
    };

  const profilesArray = primaryDomainResolvedRequestArray(
    responseFromRelation,
    handle,
    platform
  )
    .filter(
      (x) =>
        x.platform !== PlatformType.unstoppableDomains ||
        !x.identity.endsWith(".eth")
    )
    .sort((a, b) => (a.isPrimary === b.isPrimary ? 0 : a.isPrimary ? -1 : 1));

  if (!profilesArray.some((x) => x.platform !== PlatformType.nextid))
    return {
      identity: handle,
      code: 404,
      message: ErrorMessages.invalidResolved,
      platform,
    };
  const responsesToSort = profilesArray.map((x) =>
    generateProfileStruct(x as ProfileRecord, ns)
  );
  const returnRes = PLATFORMS_TO_EXCLUDE.includes(platform)
    ? responsesToSort
    : sortProfilesByPlatform(responsesToSort, platform, handle);

  if (
    platform === PlatformType.ethereum &&
    !returnRes.some((x) => x?.address === handle)
  ) {
    returnRes.unshift(responsesToSort.find((x) => x?.address === handle)!);
  }

  if (!returnRes.length && platform === PlatformType.ethereum) {
    const nsObj = {
      address: handle,
      identity: handle,
      platform: PlatformType.ethereum,
      displayName: formatText(handle),
      avatar: null,
      description: null,
    };
    returnRes.push(
      (ns
        ? nsObj
        : {
            ...nsObj,
            email: null,
            location: null,
            header: null,
            links: {},
          }) as ProfileAPIResponse
    );
  }

  const uniqRes = returnRes.reduce((pre, cur) => {
    if (
      cur &&
      !pre.find(
        (x: ProfileAPIResponse) =>
          x.platform === cur.platform && x.identity === cur.identity
      )
    ) {
      pre.push(cur as ProfileAPIResponse);
    }
    return pre;
  }, [] as ProfileAPIResponse[]);

  return uniqRes.filter((x: ProfileAPIResponse) => !x?.error).length
    ? uniqRes
    : {
        identity: handle,
        code: 404,
        message: uniqRes[0]?.error || ErrorMessages.notFound,
        platform,
      };
};

export const resolveUniversalHandle = async (
  handle: string,
  req: NextRequest,
  platform: PlatformType,
  ns?: boolean
) => {
  const handleToQuery = prettify(handle);

  if (!handleToQuery || !platform)
    return errorHandle({
      identity: handle,
      platform: PlatformType.nextid,
      code: 404,
      message: ErrorMessages.invalidIdentity,
    });

  if (
    platform === PlatformType.ethereum &&
    !isValidEthereumAddress(handleToQuery)
  )
    return errorHandle({
      identity: handle,
      platform: PlatformType.ethereum,
      code: 404,
      message: ErrorMessages.invalidAddr,
    });
  const res = (await resolveUniversalRespondFromRelation({
    platform,
    handle: handleToQuery,
    req,
    ns,
  })) as any;

  if (res.message) {
    return errorHandle({
      identity: res.identity,
      platform: res.platform,
      code: res.code,
      message: res.message,
    });
  } else {
    return respondWithCache(JSON.stringify(res));
  }
};
