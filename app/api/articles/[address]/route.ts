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
  const address = searchParams.get("address") || "";
  const domain = searchParams.get("domain") || "";
  const limit = parseInt(searchParams.get("limit") || "") || 10;
  const emptyResultStruct = {
    sites: new Array<ArticleSite>(),
    items: new Array<ArticleItem>(),
  };
  let profileIdentity = domain;

  const emptyReturn = () => NextResponse.json(emptyResultStruct);
  let result = { ...emptyResultStruct };
  let rssArticles = {} as any;

  if (!isValidEthereumAddress(address)) return emptyReturn();
  if (
    domain &&
    [
      PlatformType.ens,
      PlatformType.dotbit,
      PlatformType.unstoppableDomains,
    ].includes(handleSearchPlatform(domain))
  ) {
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

  if (!profileIdentity) {
    profileIdentity = (await fetch(baseURL + "/ns/ens/" + address).then((res) =>
      res.json()
    )).identity;
  }

  fireflyArticles?.data?.map((x: any) => {
    const content = JSON.parse(x.content_body);
    if (x.platform === 1) {
      // mirror
      result.items.push({
        title: content.content.title,
        link: `${MirrorBaseURL}/${profileIdentity}/${x.original_id}`,
        description: subStr(content.content.body),
        published: x.content_timestamp * 1000,
        body: content.content.body,
        platform: ArticlePlatform.mirror,
      });
      if (!result.sites.some((x) => x.platform === ArticlePlatform.mirror)) {
        result.sites.push({
          platform: ArticlePlatform.mirror,
          name: `${profileIdentity}'s Mirror`,
          description: "",
          image: "",
          link: `${MirrorBaseURL}/${profileIdentity}`,
        });
      }
    } else {
      // paragraph
      result.items.push({
        title: content.title,
        link: content.url
          ? `https://${content.url}`
          : `${ParagraphBaseURL}/@${profileIdentity}/${content.slug}`,
        description: subStr(content.markdown),
        published: x.content_timestamp * 1000,
        body: content.markdown,
        platform: ArticlePlatform.paragraph,
      });
      if (!result.sites.some((x) => x.platform === ArticlePlatform.paragraph)) {
        result.sites.push({
          platform: ArticlePlatform.paragraph,
          name: `${profileIdentity}'s Paragraph`,
          description: "",
          image: "",
          link: `${ParagraphBaseURL}/@${profileIdentity}`,
        });
      }
    }
  });
  result.items = [
    ...result.items
      .sort((a: ArticleItem, b: ArticleItem) => {
        return b.published - a.published;
      })
      .slice(0, limit),
  ];

  return respondWithCache(JSON.stringify(result));
}
