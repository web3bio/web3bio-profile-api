import {
  errorHandle,
  formatText,
  formatTimestamp,
  handleSearchPlatform,
  isValidEthereumAddress,
  isWeb3Address,
  prettify,
  respondWithCache,
  shouldPlatformFetch,
} from "@/utils/utils";
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
  LinksItem,
  NSResponse,
  ProfileRecord,
  ProfileResponse,
} from "@/utils/types";
import { isIPFS_Resource, resolveIPFS_CID } from "./ipfs";
import { SourceType } from "./source";

// Cache platform-specific record lists to avoid recreating them
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

// Create a Set for faster platform lookups
const IDENTITY_BASED_PLATFORMS = new Set([
  PlatformType.farcaster,
  PlatformType.lens,
]);

export const resolveIdentityResponse = async (
  handle: string,
  platform: PlatformType,
  headers: AuthHeaders,
  ns: boolean,
) => {
  const res = await queryIdentityGraph(
    ns ? QueryType.GET_PROFILES_NS : QueryType.GET_PROFILES,
    handle,
    platform,
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
): Promise<ProfileResponse | NSResponse> {
  // Basic profile data used in both response types
  const nsObj: NSResponse = {
    address: data.address,
    identity: data.identity,
    platform: data.platform,
    displayName:
      data.displayName ||
      (isWeb3Address(data.identity)
        ? formatText(data.identity)
        : data.identity),
    avatar: null,
    description: data.description || null,
  };

  // Fetch social links and avatar concurrently
  const [socialData, avatar] = await Promise.all([
    generateSocialLinks(data, edges),
    resolveEipAssetURL(data.avatar),
  ]);

  nsObj.avatar = avatar;

  if (ns) {
    return nsObj;
  }

  return {
    ...nsObj,
    status: data.texts?.status || null,
    createdAt: data.createdAt ? formatTimestamp(data.createdAt) : null,
    email: data.texts?.email || null,
    location: resolveLocation(data.texts?.location),
    header: data.texts?.header
      ? await resolveEipAssetURL(data.texts.header)
      : null,
    contenthash: socialData.contenthash || null,
    links: socialData.links || {},
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
  } catch (e: unknown) {
    return errorHandle({
      identity: handle,
      platform,
      code: e instanceof Error ? Number(e.cause) : 500,
      message: e instanceof Error ? e.message : ErrorMessages.unknownError,
    });
  }
};

const resolveContenthash = async (
  originalContenthash: string,
  platform: PlatformType,
  texts: Record<string, string>,
) => {
  if (
    ![
      PlatformType.unstoppableDomains,
      PlatformType.solana,
      PlatformType.sns,
    ].includes(platform)
  ) {
    return originalContenthash || null;
  }

  // UD
  if (platform === PlatformType.unstoppableDomains) {
    if (!originalContenthash) return null;
    return isIPFS_Resource(originalContenthash)
      ? `ipfs://${originalContenthash}`
      : originalContenthash;
  }

  // SNS/Solana
  const ipnsHash = texts?.["ipns"];
  const ipfsHash = texts?.["ipfs"];

  if (ipnsHash) {
    return /^(https?:\/\/|ipns:\/\/)/i.test(ipnsHash)
      ? ipnsHash
      : `ipns://${ipnsHash}`;
  }

  if (ipfsHash) {
    if (/^(https?:\/\/|ipfs:\/\/)/i.test(ipfsHash)) return ipfsHash;
    return isIPFS_Resource(ipfsHash)
      ? `ipfs://${resolveIPFS_CID(ipfsHash)}`
      : null;
  }

  if (originalContenthash) {
    const ipnsMatch = originalContenthash.match(/ipns=(k51[a-zA-Z0-9]{59})/i);
    if (ipnsMatch?.[1]) {
      return `ipns://${ipnsMatch[1]}`;
    }
    if (isIPFS_Resource(originalContenthash)) {
      return `ipfs://${resolveIPFS_CID(originalContenthash)}`;
    }
  }

  return null;
};

export const generateSocialLinks = async (
  data: ProfileRecord,
  edges?: IdentityGraphEdge[],
) => {
  const { platform, texts, identity, contenthash: originalContenthash } = data;
  const links: Record<string, LinksItem> = {};

  // Resolve contenthash early
  const contenthash = await resolveContenthash(
    originalContenthash,
    platform,
    texts,
  );

  if (!texts && !IDENTITY_BASED_PLATFORMS.has(platform)) {
    return { links, contenthash };
  }

  // Platform-specific link generation
  switch (platform) {
    case PlatformType.basenames:
    case PlatformType.ethereum:
    case PlatformType.linea:
    case PlatformType.ens:
      if (!texts) break;
      // Process ENS text records
      for (const [textKey, value] of Object.entries(texts)) {
        const platformKey = Array.from(PLATFORM_DATA.keys()).find((k) =>
          PLATFORM_DATA.get(k)?.ensText?.includes(textKey.toLowerCase()),
        );
        if (platformKey) {
          const resolvedHandle = resolveHandle(value, platformKey);
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

      for (const [textKey, value] of Object.entries(texts)) {
        const platformKey = Array.from(PLATFORM_DATA.keys()).find((k) =>
          PLATFORM_DATA.get(k)?.ensText?.includes(textKey.toLowerCase()),
        );
        if (platformKey) {
          const resolvedHandle = resolveHandle(value, platformKey);
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
      if (!texts) break;

      for (const [textKey, value] of Object.entries(texts)) {
        const platformKey = Array.from(PLATFORM_DATA.keys()).find((k) =>
          PLATFORM_DATA.get(k)?.ensText?.includes(textKey.toLowerCase()),
        );
        if (platformKey) {
          const resolvedHandle = resolveHandle(value, platformKey);
          links[textKey] = {
            link: getSocialMediaLink(value, platformKey)!,
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
  return input.map(resolveIdentity).filter(Boolean) as string[];
};

const resolveLocation = (
  location:
    | string
    | {
        city: string;
        state: string;
        country: string;
      },
): string | null => {
  if (!location) return null;
  if (typeof location === "string") return location;

  const { city = null, state = null, country: rawCountry = null } = location;
  const country = rawCountry
    ? rawCountry.replace("United States of America", "US")
    : null;

  if (!city && !state && !country) return null;

  if (city && state && city === state) return city;
  if (city && state) return `${city}, ${state}`;
  if (city && country) return `${city}, ${country}`;
  if (state && country) return `${state}, ${country}`;

  return city || state || country;
};
