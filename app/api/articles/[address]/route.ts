import {
  baseURL,
  handleSearchPlatform,
  isValidEthereumAddress,
  respondWithCache,
} from "@/utils/base";
import { PlatformType } from "@/utils/platform";
import { ContenthashResponse } from "@/utils/types";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const MirrorBaseURL = "https://mirror.xyz";
const ParagraphBaseURL = "https://paragraph.xyz";
const { parse } = require("rss-to-json");

const subStr = (str: string) =>
  str.length > 100 ? `${str.substring(0, 80)}...` : str;

enum ArticlePlatform {
  contenthash = "contenthash",
  paragraph = "paragraph",
  mirror = "mirror",
}

const fetchRss = async (
  handle: string,
  limit: number
): Promise<ContenthashResponse | null> => {
  try {
    const response = await fetch(
      `https://contenthash.web3.bio/api/rss?query=${handle}&mode=list&limit=${limit}`
    );
    return await response.json();
  } catch (e) {
    console.error("Error fetching RSS:", e);
    return null;
  }
};

const fetchArticle = async (address: string, limit: number) => {
  const response = await fetch("https://api.firefly.land/article/v1/article", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ addresses: [address], limit }),
  }).catch((e) => null);
  return response ? response?.json() : [];
};

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const address = searchParams.get("address") || "";
  const domain = searchParams.get("domain") || "";
  const contenthash = searchParams.get("contenthash") === "true";
  const limit = parseInt(searchParams.get("limit") || "10", 10);

  const emptyResultStruct = { sites: new Array(), items: new Array() };

  if (!isValidEthereumAddress(address) && !domain) {
    return NextResponse.json(emptyResultStruct);
  }

  let resolvedAddress = address;
  let resolvedDomain = domain;

  if (!address || !domain) {
    const searchPlatform = domain
      ? handleSearchPlatform(domain)
      : PlatformType.ens;
    const profile = await fetch(
      `${baseURL}/ns/${searchPlatform}/${domain || address}`
    ).then((res) => res.json());
    resolvedAddress = profile.address;
    resolvedDomain = profile.identity;
  }

  const result = { ...emptyResultStruct };

  if (contenthash) {
    const rssArticles = await fetchRss(resolvedDomain, limit);
    if (rssArticles && rssArticles?.items) {
      result.items.push(
        ...rssArticles.items.map((x: any) => ({
          title: x.title,
          link: x.link,
          description: x.description,
          published: new Date(x.published).getTime(),
          body: x.description,
          platform: ArticlePlatform.contenthash,
        }))
      );
      result.sites.push({
        platform: ArticlePlatform.contenthash,
        name: rssArticles.title,
        description: rssArticles.description,
        image: rssArticles.image,
        link: rssArticles.link,
      });
    }
  }

  const fireflyArticles = await fetchArticle(resolvedAddress, limit);
  let paragraphUser = "";

  fireflyArticles?.data?.forEach((x: any) => {
    const content = JSON.parse(x.content_body);
    const published = x.content_timestamp * 1000;

    if (x.platform === 1) {
      // mirror
      result.items.push({
        title: content.content.title,
        link: `${MirrorBaseURL}/${resolvedDomain}/${x.original_id}`,
        description: subStr(content.content.body),
        published,
        body: content.content.body,
        platform: ArticlePlatform.mirror,
      });
    } else if (x.platform === 2) {
      // paragraph
      if (content.url && !paragraphUser) {
        paragraphUser = content.url.includes("@")
          ? content.url.match(/paragraph\.xyz\/@([a-zA-Z0-9_-]+)/)[1]
          : content.url.split("/")[0].split(".")[0];
      }
      result.items.push({
        title: content.title,
        link: content.url
          ? `https://${content.url}`
          : `${ParagraphBaseURL}/@${resolvedDomain}/${content.slug}`,
        description: subStr(content.markdown),
        published,
        body: content.markdown,
        platform: ArticlePlatform.paragraph,
      });
    }
  });

  await Promise.all(
    [
      result.items.some((x) => x.platform === ArticlePlatform.mirror) &&
        parse(`https://mirror.xyz/${resolvedDomain}/feed/atom`),
      result.items.some((x) => x.platform === ArticlePlatform.paragraph) &&
        parse(
          `https://paragraph.xyz/api/blogs/rss/@${
            paragraphUser || resolvedDomain
          }`
        ),
    ].filter(Boolean)
  ).then(([mirrorSite, paragraphSite]) => {
    if (mirrorSite) {
      result.sites.push({
        platform: ArticlePlatform.mirror,
        name: mirrorSite.title || `${resolvedDomain}'s Mirror`,
        description: mirrorSite.description || "",
        image: mirrorSite.image || "",
        link: mirrorSite.link || `${MirrorBaseURL}/${resolvedDomain}`,
      });
    }
    if (paragraphSite) {
      result.sites.push({
        platform: ArticlePlatform.paragraph,
        name: paragraphSite.title || `${resolvedDomain}'s Paragraph`,
        description:
          paragraphSite.description === "undefined"
            ? ""
            : paragraphSite.description || "",
        image: paragraphSite.image || "",
        link:
          paragraphSite.link ||
          `${ParagraphBaseURL}/@${paragraphUser || resolvedDomain}`,
      });
    }
  });

  result.items = result.items
    .sort((a, b) => b.published - a.published)
    .slice(0, limit);

  return respondWithCache(JSON.stringify(result));
}
