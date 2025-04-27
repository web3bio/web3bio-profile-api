import {
  errorHandle,
  formatText,
  handleSearchPlatform,
  isValidEthereumAddress,
  isWeb3Address,
  prettify,
  respondWithCache,
  shouldPlatformFetch,
} from "@/utils/base";
import { PLATFORM_DATA, PlatformType } from "@/utils/platform";
import { QueryType, queryIdentityGraph } from "@/utils/query";
import { regexLowercaseExempt } from "@/utils/regexp";
import {
  getSocialMediaLink,
  resolveEipAssetURL,
  resolveHandle,
} from "@/utils/resolver";
import {
  AuthHeaders,
  ErrorMessages,
  IdentityGraphEdge,
  ProfileAPIResponse,
  ProfileNSResponse,
  ProfileRecord,
} from "@/utils/types";
import { isIPFS_Resource, resolveIPFS_CID } from "./ipfs";
import { SourceType } from "./source";

const UD_ACCOUNTS_LIST = [
  PlatformType.twitter,
  PlatformType.discord,
  PlatformType.reddit,
  PlatformType.lens,
  PlatformType.telegram,
  PlatformType.youtube,
  PlatformType.url,
];
const SNS_RECORDS_LIST = [
  PlatformType.twitter,
  PlatformType.telegram,
  PlatformType.reddit,
  PlatformType.url,
  PlatformType.github,
  PlatformType.discord,
  "CNAME",
];

export const resolveIdentityResponse = async (
  handle: string,
  platform: PlatformType,
  headers: AuthHeaders,
  ns: boolean,
) => {
  const res = await queryIdentityGraph(
    ns ? QueryType.GET_PROFILES_NS : QueryType.GET_PROFILES,
    handle,
    platform as PlatformType,
    headers,
  );

  if (res.msg) {
    return {
      identity: handle,
      platform,
      message: res.msg,
      code: res.code,
    };
  }

  const profile = res?.data?.identity?.profile;

  if (!profile) {
    if ([PlatformType.sns, PlatformType.ens].includes(platform)) {
      if (platform === PlatformType.ens && !isValidEthereumAddress(handle))
        throw new Error(ErrorMessages.invalidResolved, { cause: 404 });

      const nsResponse = {
        address: isWeb3Address(handle) ? handle : null,
        identity: handle,
        platform:
          platform === PlatformType.ens
            ? PlatformType.ethereum
            : PlatformType.solana,
        displayName: formatText(handle),
        avatar: null,
      };

      if (ns) return nsResponse;

      return {
        ...nsResponse,
        description: null,
        email: null,
        location: null,
        header: null,
        contenthash: null,
        links: {},
        social: {},
      };
    }

    throw new Error(ErrorMessages.notFound, { cause: 404 });
  }

  return generateProfileStruct(
    {
      ...profile,
      createdAt: res.data.identity?.registeredAt,
    },
    ns,
    res.data.identity?.identityGraph?.edges,
  );
};

export async function generateProfileStruct(
  data: ProfileRecord,
  ns?: boolean,
  edges?: IdentityGraphEdge[],
): Promise<ProfileAPIResponse | ProfileNSResponse> {
  // Pre-fetch avatar asynchronously
  const avatarPromise = resolveEipAssetURL(data.avatar);
  // Basic profile data used in both response types
  const nsObj: ProfileNSResponse = {
    address: data.address,
    identity: data.identity,
    platform: data.platform,
    displayName: data.displayName
      ? data.displayName
      : isWeb3Address(data.identity)
        ? formatText(data.identity)
        : data.identity,
    avatar: null,
    description: data.description || null,
  };

  // Fetch social links and avatar concurrently
  const results = await Promise.allSettled([
    generateSocialLinks(data, edges),
    avatarPromise,
  ]);

  const { links, contenthash } =
    results[0].status === "fulfilled"
      ? results[0].value
      : { links: {}, contenthash: null };

  const avatar = results[1].status === "fulfilled" ? results[1].value : null;

  nsObj.avatar = avatar;

  if (ns) {
    return nsObj;
  }

  // Return full profile for API response
  return {
    ...nsObj,
    status: data.texts?.status || null,
    createdAt: data.createdAt
      ? new Date(data.createdAt * 1000).toISOString()
      : null,
    email: data.texts?.email || null,
    location: resolveLocation(data.texts?.location) || null,
    header: data.texts?.header
      ? await resolveEipAssetURL(data.texts.header)
      : null,
    contenthash: contenthash || null,
    links: links || {},
    social: data.social
      ? {
          uid: data.social.uid ? Number(data.social.uid) : null,
          follower: Number(data.social.follower),
          following: Number(data.social.following),
        }
      : {},
  };
}

export const resolveIdentityHandle = async (
  handle: string,
  platform: PlatformType,
  headers: AuthHeaders,
  ns: boolean = false,
) => {
  try {
    const response = await resolveIdentityResponse(
      handle,
      platform,
      headers,
      ns,
    );
    if ("code" in response) {
      return errorHandle({
        identity: handle,
        platform,
        code: response.code,
        message: response.message,
      });
    }
    return respondWithCache(JSON.stringify(response));
  } catch (e: any) {
    return errorHandle({
      identity: handle,
      platform: platform,
      code: e.cause || 500,
      message: e.message,
    });
  }
};

const resolveContenthash = async (
  originalContenthash: string,
  platform: PlatformType,
  texts: Record<string, string>,
) => {
  // early return if not a supported platform
  if (
    ![
      PlatformType.unstoppableDomains,
      PlatformType.solana,
      PlatformType.sns,
    ].includes(platform)
  ) {
    return originalContenthash || null;
  }
  // for ud
  if (platform === PlatformType.unstoppableDomains) {
    if (!originalContenthash) return null;
    return isIPFS_Resource(originalContenthash)
      ? `ipfs://${originalContenthash}`
      : originalContenthash;
  }
  // for sns/solana
  if ([PlatformType.solana, PlatformType.sns].includes(platform)) {
    const ipnsHash = texts?.["ipns"];
    const ipfsHash = texts?.["ipfs"];
    if (ipnsHash) {
      if (/^(https?:\/\/|ipns:\/\/)/i.test(ipnsHash)) return ipnsHash;
      return `ipns://${ipnsHash}`;
    }

    if (ipfsHash) {
      if (/^(https?:\/\/|ipfs:\/\/)/i.test(ipfsHash)) return ipfsHash;
      return isIPFS_Resource(ipfsHash)
        ? `ipfs://${resolveIPFS_CID(ipfsHash)}`
        : null;
    }
    if (originalContenthash) {
      const ipnsMatch = originalContenthash.match(/ipns=(k51[a-zA-Z0-9]{59})/i);
      if (ipnsMatch && ipnsMatch[1]) {
        return `ipns://${ipnsMatch[1]}`;
      }
      if (isIPFS_Resource(originalContenthash)) {
        return `ipfs://${resolveIPFS_CID(originalContenthash)}`;
      }
    }

    return null;
  }
};

export const generateSocialLinks = async (
  data: ProfileRecord,
  edges?: IdentityGraphEdge[],
) => {
  const { platform, texts, identity, contenthash: originalContenthash } = data;
  const links: Record<string, any> = {};

  let contenthash = await resolveContenthash(
    originalContenthash,
    platform,
    texts,
  );

  const identityBasedPlatforms = [PlatformType.farcaster, PlatformType.lens];
  if (!texts && !identityBasedPlatforms.includes(platform)) {
    return { links, contenthash };
  }

  switch (platform) {
    case PlatformType.basenames:
    case PlatformType.ethereum:
    case PlatformType.linea:
    case PlatformType.ens:
      if (!texts) break;
      // Process ENS text records
      for (const textKey of Object.keys(texts)) {
        const platformKey = Array.from(PLATFORM_DATA.keys()).find((k) =>
          PLATFORM_DATA.get(k)?.ensText?.includes(textKey.toLowerCase()),
        );
        if (platformKey) {
          const resolvedHandle = resolveHandle(texts[textKey], platformKey);
          if (resolvedHandle) {
            links[platformKey] = {
              link: getSocialMediaLink(resolvedHandle, platformKey),
              handle: resolvedHandle,
              sources: resolveVerifiedLink(
                `${platformKey},${resolvedHandle}`,
                edges,
              ),
            };
          }
        }
      }
      break;
    case PlatformType.farcaster:
      // Add Farcaster link
      links[PlatformType.farcaster] = {
        link: getSocialMediaLink(identity, PlatformType.farcaster),
        handle: identity,
        sources: resolveVerifiedLink(
          `${PlatformType.farcaster},${identity}`,
          edges,
        ),
      };
      if (texts?.twitter) {
        const resolvedHandle = resolveHandle(texts.twitter);
        links[PlatformType.twitter] = {
          link: getSocialMediaLink(resolvedHandle, PlatformType.twitter),
          handle: resolvedHandle,
          sources: resolveVerifiedLink(
            `${PlatformType.twitter},${resolvedHandle}`,
            edges,
          ),
        };
      }
      break;
    case PlatformType.lens:
      // Add Lens link
      const pureHandle = identity.replace(".lens", "");
      links[PlatformType.lens] = {
        link: getSocialMediaLink(pureHandle, PlatformType.lens),
        handle: identity,
        sources: resolveVerifiedLink(`${PlatformType.lens},${identity}`, edges),
      };
      if (!texts) break;
      for (const textKey of Object.keys(texts)) {
        const platformKey = Array.from(PLATFORM_DATA.keys()).find((k) =>
          PLATFORM_DATA.get(k)?.ensText?.includes(textKey.toLowerCase()),
        );
        if (platformKey) {
          const resolvedHandle = resolveHandle(texts[textKey], platformKey);
          links[platformKey] = {
            link: getSocialMediaLink(resolvedHandle, platformKey),
            handle: resolvedHandle,
            sources: resolveVerifiedLink(
              `${platformKey},${resolvedHandle}`,
              edges,
            ),
          };
        }
      }
      break;
    case PlatformType.solana:
    case PlatformType.sns:
      // Process SNS records
      if (texts) {
        for (const recordKey of SNS_RECORDS_LIST) {
          const handle = resolveHandle(texts[recordKey]);
          if (handle) {
            const platformKey = ["CNAME", PlatformType.url].includes(recordKey)
              ? PlatformType.website
              : recordKey;

            links[platformKey] = {
              link: getSocialMediaLink(handle, platformKey)!,
              handle,
              sources: resolveVerifiedLink(`${platformKey},${handle}`, edges),
            };
          }
        }
      }
      break;
    case PlatformType.unstoppableDomains:
      // Process UD accounts
      if (texts) {
        for (const accountKey of UD_ACCOUNTS_LIST) {
          const item = texts[accountKey];
          if (item && PLATFORM_DATA.has(accountKey)) {
            const resolvedHandle = resolveHandle(item, accountKey);
            const platformKey =
              accountKey === PlatformType.url
                ? PlatformType.website
                : accountKey;
            links[platformKey] = {
              link: getSocialMediaLink(resolvedHandle, platformKey),
              handle: resolvedHandle,
              sources: resolveVerifiedLink(
                `${platformKey},${resolvedHandle}`,
                edges,
              ),
            };
          }
        }
      }
      break;
    case PlatformType.dotbit:
      // Process dotbit accounts
      if (!texts) break;
      for (const textKey of Object.keys(texts)) {
        const platformKey = Array.from(PLATFORM_DATA.keys()).find((k) =>
          PLATFORM_DATA.get(k)?.ensText?.includes(textKey.toLowerCase()),
        );
        if (platformKey) {
          const item = texts[textKey];
          const resolvedHandle = resolveHandle(item, platformKey);
          links[textKey] = {
            link: getSocialMediaLink(item, platformKey)!,
            handle: resolvedHandle,
            sources: resolveVerifiedLink(
              `${platformKey},${resolvedHandle}`,
              edges,
            ),
          };
        }
      }
      break;
  }

  return { links, contenthash };
};

export const resolveVerifiedLink = (
  key: string,
  edges?: IdentityGraphEdge[],
): SourceType[] => {
  if (!edges?.length) return [];

  const [platformType, identity] = key.split(",");

  const isWebSite = [PlatformType.website, PlatformType.dns].includes(
    platformType as PlatformType,
  );

  const sourceSet = new Set<SourceType>();

  for (const edge of edges) {
    if (isWebSite) {
      const [, targetIdentity] = edge.target.split(",");
      if (
        targetIdentity === identity &&
        [SourceType.ens, SourceType.keybase].includes(
          edge.dataSource as SourceType,
        )
      ) {
        sourceSet.add(edge.dataSource as SourceType);
      }
    } else if (edge.target === key) {
      sourceSet.add(edge.dataSource as SourceType);
    }
  }

  return Array.from(sourceSet);
};

// Resolves and normalizes a user identity string into a standardized format.
export const resolveIdentity = (input: string): string | null => {
  if (!input) return null;

  const parts = input.split(",");

  let platform: PlatformType;
  let identity: string;

  if (parts.length === 2) {
    [platform, identity] = parts as [PlatformType, string];
    identity = prettify(identity);
  } else if (parts.length === 1) {
    platform = handleSearchPlatform(input);
    identity = prettify(input);
  } else {
    return null;
  }

  if (!shouldPlatformFetch(platform) || !identity) return null;

  const normalizedIdentity = regexLowercaseExempt.test(identity)
    ? identity
    : identity.toLowerCase();

  return `${platform},${normalizedIdentity}`;
};

export const resolveIdentityBatch = (input: string[]): string[] => {
  const results: string[] = [];

  for (const id of input) {
    const processed = resolveIdentity(id);
    if (processed) {
      results.push(processed);
    }
  }
  return results;
};

const resolveLocation = (location: any) => {
  if (!location) return null;
  if (typeof location === "string") return location;
  const city = location.city || null;
  const state = location.state || null;
  const country = location.country
    ? location.country.replace("United States of America", "US")
    : null;
  if (!city && !state && !country) return null;

  const formatPair = (a: string | null, b: string | null): string =>
    a === b ? (a as string) : `${a}, ${b}`;

  if (city && state) return formatPair(city, state);
  if (state && country) return formatPair(state, country);
  if (city && country) return formatPair(city, country);

  return country;
};
