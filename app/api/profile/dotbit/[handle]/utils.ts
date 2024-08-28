import { isValidEthereumAddress } from "@/utils/base";
import { getSocialMediaLink, resolveHandle } from "@/utils/resolver";
import { PlatformType } from "@/utils/platform";
import { CoinType } from "@/utils/cointype";
import { ErrorMessages } from "@/utils/types";

const DotbitEndPoint = "https://indexer-v1.did.id/";

interface RecordItem {
  key: string;
  label: string;
  value: string;
  ttl: string;
}

const fetchDotbitProfile = async (path: string, payload: object) => {
  const response = await fetch(`${DotbitEndPoint}${path}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  return data?.data;
};

export const resolveDotbitResponse = async (handle: string) => {
  let domain, address;
  const isAddress = isValidEthereumAddress(handle);

  const payload = isAddress
    ? {
        type: "blockchain",
        key_info: { coin_type: CoinType.eth.toString(), key: handle },
      }
    : { account: handle };

  const path = isAddress ? "v1/reverse/record" : "v1/account/info";
  const res = await fetchDotbitProfile(path, payload);

  if (
    !res ||
    (!isAddress && !res.account_info) ||
    (isAddress && !res.account)
  ) {
    throw new Error(ErrorMessages.notFound, { cause: 404 });
  }

  if (isAddress) {
    address = handle;
    domain = res.account;
  } else {
    domain = res.account_info.account || handle;
    address = res.account_info.owner_key.toLowerCase();
  }

  const recordsResponse = await fetchDotbitProfile("v1/account/records", {
    account: domain,
  });
  const recordsMap = new Map<string, RecordItem>(
    recordsResponse?.records?.map((x: RecordItem) => [x.key, x])
  );

  return { domain, address, recordsMap };
};

export const resolveDotbitHandle = async (handle: string) => {
  const { address, domain, recordsMap } = await resolveDotbitResponse(handle);
  const profile: Record<string, any> = {
    address,
    identity: domain,
    platform: PlatformType.dotbit,
    displayName: domain || null,
    avatar: null,
    description: null,
    email: null,
    location: null,
    header: null,
    contenthash: null,
    links: {},
    social: {},
  };

  recordsMap.forEach((x, key) => {
    if (key.startsWith("profile.")) {
      const field = key.replace("profile.", "");
      if (
        ["avatar", "header", "location", "description", "email"].includes(field)
      ) {
        profile[field] = x.value || null;
      } else if (x.value) {
        const handle = resolveHandle(x.value, field as PlatformType);
        profile.links[field] = {
          link: getSocialMediaLink(x.value, field as PlatformType)!,
          handle,
        };
      }
    } else if (key.startsWith("dweb")) {
      profile.contenthash = `${key.replace("dweb.", "")}://${x.value}`;
    }
  });

  return profile;
};
