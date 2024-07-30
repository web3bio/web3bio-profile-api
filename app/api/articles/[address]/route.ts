import {
  baseURL,
  handleSearchPlatform,
  isValidEthereumAddress,
  respondWithCache,
} from "@/utils/base";
import { PlatformType } from "@/utils/platform";
import { ArticleItem, ArticleSite } from "@/utils/types";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const MirrorBaseURL = "https://mirror.xyz";
const ParagraphBaseURL = "https://paragraph.xyz";
const { parse } = require("rss-to-json");

const subStr = (str: string) => {
  return str.length > 100 ? str.substring(0, 80) + "..." : str;
};

enum ArticlePlatform {
  contenthash = "contenthash",
  paragraph = "paragraph",
  mirror = "mirror",
}

const fetchRss = async (handle: string, limit: number) => {
  return await fetch(
    `https://contenthash.web3.bio/api/rss?query=${handle}&mode=list&limit=${limit}`
  ).then((res) => res.json());
};

const fetchArticle = async (address: string, limit: number) => {
  return await fetch("https://api.firefly.land/article/v1/article", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      addresses: [address],
      limit,
    }),
  }).then((res) => res.json());
};

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  let address = searchParams.get("address") || "";
  let domain = searchParams.get("domain") || "";
  const contenthash = searchParams.get("contenthash") || false;
  const limit = parseInt(searchParams.get("limit") || "") || 10;
  const emptyResultStruct = {
    sites: new Array<ArticleSite>(),
    items: new Array<ArticleItem>(),
  };
  const emptyReturn = () => NextResponse.json(emptyResultStruct);
  let result = { ...emptyResultStruct };
  let rssArticles = {} as any;

  if (!isValidEthereumAddress(address) && !domain) return emptyReturn();

  if (!address || !domain) {
    const searchPlatform = domain
      ? handleSearchPlatform(domain)
      : PlatformType.ens;
    const profile = await fetch(
      `${baseURL}/ns/${searchPlatform}/${domain || address}`
    ).then((res) => res.json());
    address = profile.address;
    domain = profile.identity;
  }

  if (contenthash) {
    rssArticles = await fetchRss(domain, limit);
    if (rssArticles?.items) {
      result.items = [
        ...rssArticles.items?.map((x: ArticleItem) => ({
          title: x.title,
          link: x.link,
          description: x.description,
          published: new Date(x.published).getTime(),
          body: x.description,
          platform: ArticlePlatform.contenthash,
        })),
      ];
      result.sites.push({
        platform: ArticlePlatform.contenthash,
        name: rssArticles.title,
        description: rssArticles.description,
        image: rssArticles.image,
        link: rssArticles.link,
      });
    }
  }

  const fireflyArticles = await fetchArticle(address, limit);
  let paragraphUser = "";
  fireflyArticles?.data?.map((x: any) => {
    const content = JSON.parse(x.content_body);
    if (x.platform === 1) {
      // mirror
      result.items.push({
        title: content.content.title,
        link: `${MirrorBaseURL}/${domain}/${x.original_id}`,
        description: subStr(content.content.body),
        published: x.content_timestamp * 1000,
        body: content.content.body,
        platform: ArticlePlatform.mirror,
      });
    } else if (x.platform === 2) {
      // paragraph
      if (content.url && !paragraphUser) {
        if (content.url.includes("@")) {
          paragraphUser = content.url.match(
            /paragraph\.xyz\/@([a-zA-Z0-9_-]+)/
          )[1];
        } else {
          paragraphUser = content.url.split("/")[0].split(".")[0];
        }
      }
      result.items.push({
        title: content.title,
        link: content.url
          ? `https://${content.url}`
          : `${ParagraphBaseURL}/@${domain}/${content.slug}`,
        description: subStr(content.markdown),
        published: x.content_timestamp * 1000,
        body: content.markdown,
        platform: ArticlePlatform.paragraph,
      });
    }
  });

  if (result.items.some((x) => x.platform === ArticlePlatform.mirror)) {
    const siteJSON = await parse(`https://mirror.xyz/${domain}/feed/atom`);
    if (siteJSON?.title) {
      result.sites.push({
        platform: ArticlePlatform.mirror,
        name: siteJSON.title,
        description: siteJSON.description,
        image: siteJSON.image,
        link: siteJSON.link,
      });
    }
  }
  if (result.items.some((x) => x.platform === ArticlePlatform.paragraph)) {
    const siteJSON = await parse(
      `https://paragraph.xyz/api/blogs/rss/@${paragraphUser || domain}`
    );
    result.sites.push({
      platform: ArticlePlatform.paragraph,
      name: siteJSON.title || `${domain}'s Mirror`,
      description: siteJSON.description || "",
      image: siteJSON.image || "",
      link: siteJSON.link || `${ParagraphBaseURL}/@${paragraphUser}`,
    });
  }
  result.items = [
    ...result.items
      .sort((a: ArticleItem, b: ArticleItem) => {
        return b.published - a.published;
      })
      .slice(0, limit),
  ];

  return respondWithCache(JSON.stringify(result));
}
