import { baseURL, handleSearchPlatform, respondWithCache } from "@/utils/base";
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

const fetchArticle = async (
  address: string,
  limit: number,
  platform: ArticlePlatform
) => {
  return await fetch("https://api.firefly.land/article/v1/article", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      addresses: [address],
      limit,
      platform: platform === ArticlePlatform.contenthash ? "" : platform,
    }),
  }).then((res) => res.json());
};

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const handle = searchParams.get("handle") || "";
  const limit = parseInt(searchParams.get("limit") || "") || 10;
  const platform = searchParams.get("platform") || "";
  const system = handleSearchPlatform(handle);
  const emptyResultStruct = {
    sites: new Array<ArticleSite>(),
    items: new Array<ArticleItem>(),
  };
  const emptyReturn = () => NextResponse.json(emptyResultStruct);
  let result = { ...emptyResultStruct };
  let rssArticles = {} as any;
  const profile = await fetch(baseURL + `/api/profile/${system}/${handle}`)
    .then((res) => res.json())
    .catch((e) => null);
  if (!profile) return emptyReturn();

  if (
    [PlatformType.ethereum, PlatformType.ens, PlatformType.dotbit].includes(
      system
    ) &&
    ![ArticlePlatform.mirror, ArticlePlatform.paragraph].includes(
      platform as ArticlePlatform
    )
  ) {
    rssArticles = await fetchRss(profile.identity, limit);
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
    }
  }

  if (platform !== ArticlePlatform.contenthash) {
    const fireflyArticles = await fetchArticle(
      profile.address,
      limit,
      platform as ArticlePlatform
    );
    fireflyArticles?.data?.map((x: any) => {
      const content = JSON.parse(x.content_body);
      if (x.platform === 1) {
        // mirror
        result.items.push({
          title: content.content.title,
          link: `${MirrorBaseURL}/${profile.identity}/${x.original_id}`,
          description: subStr(content.content.body),
          published: x.content_timestamp * 1000,
          body: content.content.body,
          platform: ArticlePlatform.mirror,
        });
      } else {
        // paragraph
        result.items.push({
          title: content.title,
          link: content.url
            ? `https://${content.url}`
            : `${ParagraphBaseURL}/@${profile.identity}/${content.slug}`,
          description: subStr(content.markdown),
          published: x.content_timestamp * 1000,
          body: content.markdown,
          platform: ArticlePlatform.paragraph,
        });
      }
    });
    result.items = [
      ...result.items
        .sort((a: ArticleItem, b: ArticleItem) => {
          return b.published - a.published;
        })
        .slice(0, limit),
    ];
    [
      ArticlePlatform.contenthash,
      ArticlePlatform.mirror,
      ArticlePlatform.paragraph,
    ].forEach((x) => {
      if (result.items.some((i) => i.platform === x)) {
        if (x === ArticlePlatform.contenthash) {
          result.sites.push({
            platform: ArticlePlatform.contenthash,
            name: rssArticles.title,
            description: rssArticles.description,
            image: rssArticles.image,
            link: rssArticles.link,
          });
        }
        if (x === ArticlePlatform.mirror) {
          result.sites.push({
            platform: ArticlePlatform.mirror,
            name: `${profile.identity}'s Mirror`,
            description: "",
            image: "",
            link: `${MirrorBaseURL}/${profile.identity}`,
          });
        }
        if (x === ArticlePlatform.paragraph) {
          result.sites.push({
            platform: ArticlePlatform.paragraph,
            name: `${profile.identity}'s Paragraph`,
            description: "",
            image: "",
            link: `${ParagraphBaseURL}/@${profile.identity}`,
          });
        }
      }
    });
  }
  return respondWithCache(JSON.stringify(result));
}
