import {
  regexDotbit,
  regexEns,
  regexEth,
  regexLens,
  regexSpaceid,
  regexTwitter,
  regexUnstoppableDomains,
} from "./regexp";

type SocialPlatform = {
  key: string;
  color?: string;
  icon?: string;
  label: string;
  urlPrefix?: string;
  ensText?: string[];
  dotbitText?: string[];
};

export enum PlatformType {
  ens = "ENS",
  dotbit = "dotbit",
  lens = "lens",
  ethereum = "ethereum",
  twitter = "twitter",
  nextid = "nextid",
  keybase = "keybase",
  reddit = "reddit",
  github = "github",
  unstoppableDomains = "unstoppabledomains",
  farcaster = "farcaster",
  space_id = "space_id",
  telegram = "telegram",
  instagram = "instagram",
  rss3 = "rss3",
  cyberconnect = "cyberconnect",
  opensea = "opensea",
  sybil = "sybil",
  discord = "discord",
  url = "url",
  website = "website",
  linkedin = "linkedin",
  dns = "dns",
  lenster = "lenster",
  facebook = "facebook",
  weibo = "weibo",
  youtube = "youtube",
  tiktok = "tiktok",
  bilibili = "bilibili",
  medium = "medium",
  mirror = "mirror",
  jike = "jike",
  dribbble = "dribbble",
  nostr = "nostr",
}

export const PlatformData: { [key in PlatformType]: SocialPlatform } = {
  [PlatformType.twitter]: {
    key: PlatformType.twitter,
    color: "#4A99E9",
    label: "Twitter",
    urlPrefix: "https://twitter.com/",
    ensText: ["com.twitter", "vnd.twitter", "twitter", "x"],
    dotbitText: ["profile.twitter"],
  },
  [PlatformType.ens]: {
    key: PlatformType.ens,
    color: "#5298FF",
    // TODO: add ens search icon here
    label: "ENS",
    urlPrefix: "https://app.ens.domains/search/",
    ensText: [],
  },
  [PlatformType.ethereum]: {
    key: PlatformType.ethereum,
    color: "#3c3c3d",
    label: "Ethereum",
    urlPrefix: "https://etherscan.io/address/",
    ensText: [],
  },
  [PlatformType.farcaster]: {
    key: PlatformType.farcaster,
    color: "#8a63d2",
    label: "Farcaster",
    urlPrefix: "https://warpcast.com/",
    ensText: [],
  },
  [PlatformType.github]: {
    key: PlatformType.github,
    color: "#000000",
    label: "GitHub",
    urlPrefix: "https://github.com/",
    ensText: ["com.github", "vnd.github", "github"],
    dotbitText: ["profile.github"],
  },
  [PlatformType.keybase]: {
    key: PlatformType.keybase,
    color: "#4162E2",
    label: "Keybase",
    urlPrefix: "https://keybase.io/",
    ensText: ["io.keybase"],
  },
  [PlatformType.lens]: {
    key: PlatformType.lens,
    color: "#BDFC5A",
    label: "Lens",
    urlPrefix: "https://www.lensfrens.xyz/",
    ensText: [],
  },
  [PlatformType.nextid]: {
    key: PlatformType.nextid,
    color: "#121212",
    label: "Next.ID",
    urlPrefix: "https://web3.bio/",
    ensText: [],
    dotbitText: ["profile.nextid"],
  },
  [PlatformType.reddit]: {
    key: PlatformType.reddit,
    color: "#ff4500",
    label: "Reddit",
    urlPrefix: "https://www.reddit.com/user/",
    ensText: ["com.reddit"],
    dotbitText: ["profile.reddit"],
  },
  [PlatformType.space_id]: {
    key: PlatformType.space_id,
    color: "#71EBAA",
    label: "SPACE ID",
    urlPrefix: "https://space.id/search?query=",
    ensText: [],
  },
  [PlatformType.unstoppableDomains]: {
    key: PlatformType.unstoppableDomains,
    color: "#2E65F5",
    label: "Unstoppable Domains",
    ensText: [],
    urlPrefix: "https://unstoppabledomains.com/search?searchTerm=",
  },
  [PlatformType.telegram]: {
    key: PlatformType.telegram,
    color: "#0088cc",
    label: "Telegram",
    ensText: ["org.telegram", "vnd.telegram", "VND.TELEGRAM"],
    dotbitText: ["profile.telegram"],
    urlPrefix: "https://t.me/",
  },
  [PlatformType.instagram]: {
    key: PlatformType.instagram,
    color: "#EA3377",
    label: "Instagram",
    ensText: ["com.instagram"],
    dotbitText: ["profile.instagram"],
    urlPrefix: "https://www.instagram.com/",
  },
  [PlatformType.weibo]: {
    key: PlatformType.instagram,
    label: "Weibo",
    ensText: [],
    dotbitText: ["profile.weibo"],
    urlPrefix: "https://m.weibo.cn/",
  },
  [PlatformType.dotbit]: {
    key: PlatformType.dotbit,
    color: "#0e7dff",
    label: ".bit",
    ensText: [],
    urlPrefix: "https://data.did.id/",
  },
  [PlatformType.rss3]: {
    key: PlatformType.rss3,
    color: "#3070F6",
    label: "RSS3",
    ensText: [],
    urlPrefix: "https://rss3.io/",
  },
  [PlatformType.cyberconnect]: {
    key: PlatformType.cyberconnect,
    color: "#000000",
    // TODO: icons to add
    label: "CyberConnect",
    ensText: [],
  },
  [PlatformType.opensea]: {
    key: PlatformType.opensea,
    color: "#407FDB",
    label: "OpenSea",
    ensText: [],
    urlPrefix: "https://opensea.io/",
  },
  [PlatformType.sybil]: {
    key: PlatformType.sybil,
    color: "#4125E1",
    label: "Sybil",
    ensText: [],
    urlPrefix: "https://sybil.org/",
  },
  [PlatformType.discord]: {
    key: PlatformType.discord,
    color: "#5865f2",
    label: "Discord",
    ensText: ["com.discord"],
    dotbitText: ["profile.discord"],
    urlPrefix: "https://discord.gg/",
  },
  [PlatformType.url]: {
    key: PlatformType.url,
    color: "#121212",
    label: "Website",
    ensText: [],
  },
  [PlatformType.website]: {
    key: PlatformType.website,
    color: "#121212",
    label: "Website",
    ensText: ["url"],
    dotbitText: ["profile.website"],
  },
  [PlatformType.linkedin]: {
    key: PlatformType.linkedin,
    color: "#195DB4",
    label: "LinkedIn",
    ensText: ["com.linkedin"],
    urlPrefix: "https://www.linkedin.com/in/",
    dotbitText: ["profile.linkedin"],
  },
  [PlatformType.dns]: {
    key: PlatformType.dns,
    label: "DNS",
  },
  [PlatformType.lenster]: {
    key: PlatformType.lenster,
    color: "#845EEE",
    label: "Lenster",
    urlPrefix: "https://lenster.xyz/u/",
  },
  [PlatformType.facebook]: {
    key: PlatformType.facebook,
    label: "Facebook",
    urlPrefix: "https://www.facebook.com/",
    dotbitText: ["profile.facebook"],
  },
  [PlatformType.youtube]: {
    key: PlatformType.youtube,
    label: "Youtube",
    urlPrefix: "https://www.youtube.com/",
    dotbitText: ["profile.youtube"],
  },
  [PlatformType.tiktok]: {
    key: PlatformType.tiktok,
    label: "TikTok",
    urlPrefix: "https://www.tiktok.com/",
    dotbitText: ["profile.tiktok"],
  },
  [PlatformType.bilibili]: {
    key: PlatformType.bilibili,
    label: "Bilibili",
    urlPrefix: "https://www.bilibili.com/",
    dotbitText: ["profile.bilibili"],
  },
  [PlatformType.medium]: {
    key: PlatformType.medium,
    label: "Medium",
    urlPrefix: "https://medium.com/",
    dotbitText: ["profile.medium"],
  },
  [PlatformType.mirror]: {
    key: PlatformType.mirror,
    label: "Mirror",
    urlPrefix: "https://mirror.xyz/",
    dotbitText: ["profile.mirror"],
  },
  [PlatformType.jike]: {
    key: PlatformType.jike,
    label: "Jike",
    urlPrefix: "https://web.okjike.com/",
    dotbitText: ["profile.jike"],
  },
  [PlatformType.dribbble]: {
    key: PlatformType.dribbble,
    label: "Dribbble",
    urlPrefix: "https://dribbble.com/search/",
    dotbitText: ["profile.dribbble"],
  },
  [PlatformType.nostr]: {
    key: PlatformType.nostr,
    label: "Nostr",
    urlPrefix: "https://snort.social/p/",
    dotbitText: ["profile.nostr"],
  },
};

export const SocialPlatformMapping = (platform: PlatformType) => {
  return (
    PlatformData[platform] ?? {
      key: platform,
      color: "",
      icon: "",
      label: platform,
      ensText: [],
    }
  );
};

export const handleSearchPlatform = (term: string) => {
  switch (true) {
    case regexEns.test(term):
      return PlatformType.ens;
    case regexEth.test(term):
      return PlatformType.ethereum;
    case regexLens.test(term):
      return PlatformType.lens;
    case regexUnstoppableDomains.test(term):
      return PlatformType.unstoppableDomains;
    case regexSpaceid.test(term):
      return PlatformType.space_id;
    case regexDotbit.test(term):
      return PlatformType.dotbit;
    case regexTwitter.test(term):
      return PlatformType.twitter;
    default:
      return PlatformType.nextid;
  }
};
