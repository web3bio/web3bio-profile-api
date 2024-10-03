import urlcat from "urlcat";

const MATCH_IPFS_CID_RAW =
  "Qm[1-9A-HJ-NP-Za-km-z]{44,}|b[2-7A-Za-z]{58,}|B[2-7A-Z]{58,}|z[1-9A-HJ-NP-Za-km-z]{48,}|F[\\dA-F]{50,}";
const CORS_HOST = "https://cors-next.r2d2.to";
const CF_IPFS_HOST = "https://cloudflare-ipfs.com";
const IPFS_GATEWAY_HOST = "https://gateway.pinata.cloud";
const MATCH_IPFS_DATA_RE = /ipfs\/(data:.*)$/;
const MATCH_IPFS_CID_RE = new RegExp(MATCH_IPFS_CID_RAW);
const MATCH_IPFS_CID_AT_STARTS_RE = new RegExp(
  `^https://${MATCH_IPFS_CID_RAW}`,
);
const MATCH_IPFS_CID_AND_PATHNAME_RE = new RegExp(
  `${MATCH_IPFS_CID_RAW}\\/?.*`,
);

export const resolveIPFS_CID = (str: string) =>
  str.match(MATCH_IPFS_CID_RE)?.[1];

const trimQuery = (url: string) => url.split("?")[0];

export const isIPFS_Resource = (str: string) => {
  return MATCH_IPFS_CID_RE.test(str);
};

export function resolveIPFS_URL(
  cidOrURL: string | undefined | null,
): string | undefined | null {
  if (!cidOrURL) return cidOrURL;

  // eliminate cors proxy
  if (cidOrURL.startsWith(CORS_HOST) || cidOrURL.startsWith(CF_IPFS_HOST)) {
    const host = cidOrURL.startsWith(CORS_HOST) ? CORS_HOST : CF_IPFS_HOST;
    return trimQuery(
      resolveIPFS_URL(
        decodeURIComponent(cidOrURL.replace(new RegExp(`^${host}\??`), "")),
      )!,
    );
  }

  // ipfs.io host
  if (cidOrURL.startsWith("https://ipfs.io")) {
    // base64 data string
    const [_, data] = cidOrURL.match(MATCH_IPFS_DATA_RE) ?? [];
    if (data) return decodeURIComponent(data);

    // plain
    return trimQuery(decodeURIComponent(cidOrURL));
  }

  // a ipfs hash fragment
  if (isIPFS_Resource(cidOrURL) || cidOrURL.includes("ipfs:")) {
    // starts with a cid
    if (cidOrURL.startsWith("ipfs://")) {
      cidOrURL = cidOrURL.replace("ipfs://", "");
    }
    if (MATCH_IPFS_CID_AT_STARTS_RE.test(cidOrURL)) {
      try {
        const u = new URL(cidOrURL);
        const cid = resolveIPFS_CID(cidOrURL);

        if (cid) {
          const path = u.pathname === "/" ? "" : `/${u.pathname.slice(1)}`;
          return resolveIPFS_URL(
            urlcat(`${IPFS_GATEWAY_HOST}/ipfs/:cid${path}`, {
              cid,
              path: u.pathname.slice(1),
            }),
          );
        }
      } catch (error) {
        // do nothing
      }
    }

    const pathname = cidOrURL.match(MATCH_IPFS_CID_AND_PATHNAME_RE)?.[0];
    if (pathname) return trimQuery(`${IPFS_GATEWAY_HOST}/ipfs/${pathname}`);
  }

  return cidOrURL;
}
