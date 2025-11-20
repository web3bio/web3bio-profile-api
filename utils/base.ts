import {
  Source,
  Platform,
  type NSResponse,
  type ProfileResponse,
  type SocialLinks,
  type SocialLinksItem,
  ErrorMessages,
  AddressRecord,
  Network,
} from "web3bio-profile-kit/types";
import {
  PLATFORM_DATA,
  isValidEthereumAddress,
  isWeb3Address,
  resolveIdentity,
} from "web3bio-profile-kit/utils";
import {
  errorHandle,
  formatText,
  formatTimestamp,
  respondWithCache,
} from "@/utils/utils";
import { QueryType, queryIdentityGraph } from "@/utils/query";
import {
  getSocialMediaLink,
  resolveEipAssetURL,
  resolveHandle,
} from "@/utils/resolver";
import type {
  AuthHeaders,
  IdentityGraphEdge,
  ProfileRecord,
  IdentityGraphQueryResponse,
  IdentityRecord,
} from "@/utils/types";
import { isIPFS_Resource, resolveIPFS_CID } from "./ipfs";

const UD_ACCOUNTS_LIST = [
  Platform.twitter,
  Platform.discord,
  Platform.reddit,
  Platform.lens,
  Platform.telegram,
  Platform.youtube,
  Platform.url,
];

const SNS_RECORDS_LIST = [
  Platform.twitter,
  Platform.telegram,
  Platform.reddit,
  Platform.url,
  Platform.github,
  Platform.discord,
  "CNAME",
];

export const SOCIAL_PLATFORMS = new Set([Platform.farcaster, Platform.lens]);

export const resolveIdentityResponse = async (
  handle: string,
  platform: Platform,
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
    if ([Platform.sns, Platform.ens].includes(platform)) {
      if (platform === Platform.ens && !isValidEthereumAddress(handle))
        throw new Error(ErrorMessages.INVALID_RESOLVED, { cause: 404 });

      const nsResponse = {
        address: isWeb3Address(handle) ? handle : null,
        identity: handle,
        platform:
          platform === Platform.ens ? Platform.ethereum : Platform.solana,
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

    throw new Error(ErrorMessages.NOT_FOUND, { cause: 404 });
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
    address:
      data.platform !== Platform.farcaster
        ? data.address
        : checkoutFarcasterAddress(data.addresses),
    identity: data.identity,
    platform: data.platform,
    displayName:
      data.displayName ||
      (isWeb3Address(data.identity)
        ? formatText(data.identity)
        : data.identity),
    avatar: await resolveEipAssetURL(data.avatar),
    description: data.description || null,
  };

  if (ns) {
    return nsObj;
  }

  const socialData = await generateSocialLinks(data, edges);

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
    links: (socialData.links as SocialLinks) || {},
    social:
      data.social || data.uid
        ? {
            uid: Number(data.social?.uid || data.uid) || null,
            follower: data.social?.follower
              ? Number(data.social?.follower)
              : null,
            following: data.social?.following
              ? Number(data.social?.following)
              : null,
          }
        : {},
  };
}

export const resolveIdentityHandle = async (
  handle: string,
  platform: Platform,
  headers: AuthHeaders,
  ns: boolean = false,
  pathname: string,
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
        path: pathname,
        platform,
        code: response.code,
        message: response.message,
      });
    }
    return respondWithCache(response);
  } catch (e: unknown) {
    return errorHandle({
      identity: handle,
      path: pathname,
      platform,
      code: e instanceof Error ? Number(e.cause) : 500,
      message: e instanceof Error ? e.message : ErrorMessages.UNKNOWN_ERROR,
    });
  }
};

export const processJson = async (json: IdentityGraphQueryResponse) => {
  const _json = structuredClone(json);
  const identity = _json?.data?.identity;

  if (!identity) return _json;

  const promises: Promise<any>[] = [];

  // Process main identity avatar
  if (identity.profile) {
    promises.push(
      processProfileAvatar(identity.profile).then((processedAvatar) => {
        identity.profile.avatar = processedAvatar;
      }),
    );
  }

  const vertices: IdentityRecord[] = identity.identityGraph?.vertices || [];

  if (vertices.length > 0) {
    // Find current identity in vertices
    const currentIndex = vertices.findIndex(
      (vertex) =>
        vertex.identity === identity.identity &&
        vertex.platform === identity.platform,
    );

    // Ensure current identity is at the front
    if (currentIndex === -1) {
      // Current identity not in vertices, add it at the beginning
      const currentIdentity = { ...identity };
      delete currentIdentity.identityGraph;
      vertices.unshift(currentIdentity);
    } else if (currentIndex > 0) {
      // Current identity exists but not at front, move it to front
      const [currentIdentity] = vertices.splice(currentIndex, 1);
      vertices.unshift(currentIdentity);
    }

    // Process avatars for all vertices with profiles
    const avatarPromises = vertices
      .filter((vertex) => vertex?.profile?.avatar)
      .map(async (vertex) => {
        const processedAvatar = await processProfileAvatar(vertex.profile);
        vertex.profile.avatar = processedAvatar;
      });

    if (avatarPromises.length > 0) {
      promises.push(Promise.allSettled(avatarPromises));
    }
  }

  await Promise.allSettled(promises);
  return _json;
};

const resolveContenthash = async (
  originalContenthash: string,
  platform: Platform,
  texts: Record<string, string>,
) => {
  if (
    ![Platform.unstoppableDomains, Platform.solana, Platform.sns].includes(
      platform,
    )
  ) {
    return originalContenthash || null;
  }

  // UD
  if (platform === Platform.unstoppableDomains) {
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
  const links: Record<string, SocialLinksItem> = {};

  // Resolve contenthash early
  const contenthash = await resolveContenthash(
    originalContenthash,
    platform,
    texts,
  );

  if (!texts && !SOCIAL_PLATFORMS.has(platform)) {
    return { links, contenthash };
  }

  // Platform-specific link generation
  switch (platform) {
    case Platform.basenames:
    case Platform.ethereum:
    case Platform.linea:
    case Platform.ens:
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

    case Platform.farcaster:
      // Add Farcaster link
      links[Platform.farcaster] = {
        link: getSocialMediaLink(identity, Platform.farcaster),
        handle: identity,
        sources: resolveVerifiedLink(
          `${Platform.farcaster},${identity}`,
          edges,
        ),
      };

      if (texts?.twitter) {
        const resolvedHandle = resolveHandle(texts.twitter);
        links[Platform.twitter] = {
          link: getSocialMediaLink(resolvedHandle, Platform.twitter),
          handle: resolvedHandle,
          sources: resolveVerifiedLink(
            `${Platform.twitter},${resolvedHandle}`,
            edges,
          ),
        };
      }
      break;

    case Platform.lens:
      // Add Lens link
      const pureHandle = identity.replace(".lens", "");
      links[Platform.lens] = {
        link: getSocialMediaLink(pureHandle, Platform.lens),
        handle: identity,
        sources: resolveVerifiedLink(`${Platform.lens},${identity}`, edges),
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

    case Platform.solana:
    case Platform.sns:
      // Process SNS records
      if (texts) {
        for (const recordKey of SNS_RECORDS_LIST) {
          const handle = resolveHandle(texts[recordKey]);
          if (handle) {
            const platformKey = ["CNAME", Platform.url].includes(recordKey)
              ? Platform.website
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

    case Platform.unstoppableDomains:
      if (texts) {
        for (const accountKey of UD_ACCOUNTS_LIST) {
          const item = texts[accountKey];
          if (item && PLATFORM_DATA.has(accountKey)) {
            const resolvedHandle = resolveHandle(item, accountKey);
            const platformKey =
              accountKey === Platform.url ? Platform.website : accountKey;

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
    default:
      break;
  }

  return { links, contenthash };
};

export const resolveVerifiedLink = (
  key: string,
  edges?: IdentityGraphEdge[],
): Source[] => {
  if (!edges?.length) return [];

  const [platform, identity] = key.split(",");
  const isWebSite = [Platform.website, Platform.dns].includes(
    platform as Platform,
  );
  const sourceSet = new Set<Source>();

  for (const edge of edges) {
    if (isWebSite) {
      const [, targetIdentity] = edge.target.split(",");
      if (
        targetIdentity === identity &&
        [Source.ens, Source.keybase].includes(edge.dataSource as Source)
      ) {
        sourceSet.add(edge.dataSource as Source);
      }
    } else if (edge.target === key) {
      sourceSet.add(edge.dataSource as Source);
    }
  }

  return Array.from(sourceSet);
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

const processProfileAvatar = async (
  profile: ProfileRecord,
): Promise<string | null> => {
  if (!profile?.avatar) return null;

  try {
    return await resolveEipAssetURL(profile.avatar);
  } catch {
    return null;
  }
};

const checkoutFarcasterAddress = (addresses: AddressRecord[]) => {
  if (!addresses.length) return null;
  const primaryAddress =
    addresses.find((x) => x.network === Network.ethereum && x.isPrimary) ||
    addresses.find((x) => x.isPrimary);
  return (
    primaryAddress?.address ||
    addresses.find((x) => x.network === Network.ethereum)?.address ||
    addresses[0].address
  );
};
