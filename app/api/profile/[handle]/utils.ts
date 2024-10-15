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
import { resolveHandle, resolveSocialMediaLink } from "@/utils/resolver";
import {
  ErrorMessages,
  ProfileAPIResponse,
  ProfileRecord,
} from "@/utils/types";
import { NextRequest } from "next/server";

export const NEXTID_GRAPHQL_ENDPOINT =
  process.env.NEXT_PUBLIC_GRAPHQL_SERVER || "https://graph.web3.bio/graphql";

function generateSocialLinks(texts: { [index: string]: string } | null) {
  if (!texts) return {};
  const keys = Object.keys(texts);
  const res = {};
  keys.forEach((i) => {
    if (PLATFORM_DATA.has(i as PlatformType)) {
      Object.assign(res, i, {
        handle: resolveHandle(i),
        link: resolveSocialMediaLink(texts[i], i),
      });
    }
  });

  return res;
}

function generateProfileStruct(data: ProfileRecord): ProfileAPIResponse {
  return {
    address: data.address,
    identity: data.identity,
    platform: data.platform,
    displayName: data.displayName,
    avatar: data.avatar,
    description: data.description,
    email: data.texts?.email || null,
    location: data.texts?.location || null,
    header: data.texts?.header || null,
    contenthash: data.contenthash || null,
    links: generateSocialLinks(data.texts) || {},
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
    console.log(NEXTID_GRAPHQL_ENDPOINT, handle, platform);
    const response = await fetch(NEXTID_GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: process.env.NEXT_PUBLIC_IDENTITY_GRAPH_API_KEY || "",
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
  responses: ProfileAPIResponse[],
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
  console.log(responseFromRelation);
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
    generateProfileStruct(x as ProfileRecord)
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
      pre.push(cur);
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
