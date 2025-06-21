const IPFS_CID_PATTERN =
  "Qm[1-9A-HJ-NP-Za-km-z]{44,}|b[2-7A-Za-z]{58,}|B[2-7A-Z]{58,}|z[1-9A-HJ-NP-Za-km-z]{48,}|F[\\dA-F]{50,}";
const CORS_HOST = "https://cors-next.r2d2.to";
const CF_IPFS_HOST = "https://cloudflare-ipfs.com";
const IPFS_GATEWAY_HOST = "https://ipfs.io";

// Compiled regex patterns for better performance
const MATCH_IPFS_DATA_RE = /ipfs\/(data:.*)$/;
const MATCH_IPFS_CID_RE = new RegExp(IPFS_CID_PATTERN);
const MATCH_IPFS_CID_AND_PATHNAME_RE = new RegExp(
  `(${IPFS_CID_PATTERN})(\\/.*)?`,
);

export const resolveIPFS_CID = (str: string): string | undefined =>
  str.match(MATCH_IPFS_CID_RE)?.[0];

export const isIPFS_Resource = (str: string): boolean =>
  MATCH_IPFS_CID_RE.test(str);

export function resolveIPFS_URL(
  cidOrURL: string | undefined | null,
): string | undefined | null {
  if (!cidOrURL) return cidOrURL;

  // Normalize input - trim query params and decode once
  const queryIndex = cidOrURL.indexOf("?");
  let normalizedURL =
    queryIndex !== -1
      ? decodeURIComponent(cidOrURL.slice(0, queryIndex))
      : decodeURIComponent(cidOrURL);

  // Handle CORS proxies
  if (normalizedURL.startsWith(CORS_HOST)) {
    normalizedURL = normalizedURL.slice(CORS_HOST.length + 1); // +1 for potential '?'
  } else if (normalizedURL.startsWith(CF_IPFS_HOST)) {
    normalizedURL = normalizedURL.slice(CF_IPFS_HOST.length + 1);
  }

  // Handle ipfs.io URLs
  if (normalizedURL.startsWith("https://ipfs.io")) {
    const dataMatch = normalizedURL.match(MATCH_IPFS_DATA_RE);
    if (dataMatch?.[1]) {
      return decodeURIComponent(dataMatch[1]);
    }
    return normalizedURL;
  }

  // Handle ipfs protocol
  if (normalizedURL.startsWith("ipfs://")) {
    normalizedURL = normalizedURL.slice(7); // Remove 'ipfs://'
  }

  // Handle IPFS resources (CIDs with or without paths)
  if (isIPFS_Resource(normalizedURL) || normalizedURL.includes("ipfs:")) {
    const cidMatch = normalizedURL.match(MATCH_IPFS_CID_AND_PATHNAME_RE);
    if (cidMatch) {
      const [, cid, pathname = ""] = cidMatch;
      return `${IPFS_GATEWAY_HOST}/ipfs/${cid}${pathname}`;
    }
  }

  return normalizedURL;
}
