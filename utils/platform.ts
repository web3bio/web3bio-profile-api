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
  ckb = "ckb",
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
  tron = "tron",
  lenster = "lenster",
  hey = "hey",
  facebook = "facebook",
  threads = "threads",
  weibo = "weibo",
  youtube = "youtube",
  tiktok = "tiktok",
  bilibili = "bilibili",
  medium = "medium",
  mirror = "mirror",
  jike = "jike",
  nostr = "nostr",
  poap = "poap",
  dribbble = "dribbble",
  knn3 = "knn3",
  ethLeaderboard = "ethLeaderboard",
  the_graph = "the_graph",
  rpc_server = "rpc_server",
  twitter_hexagon = "twitter_hexagon",
  uniswap = "uniswap",
  degenscore = "degenscore",
  firefly = "firefly",
}

export const PlatformData: { [key in PlatformType]: SocialPlatform } = {
  [PlatformType.twitter]: {
    key: PlatformType.twitter,
    color: "#4A99E9",
    icon: "icons/icon-twitter.svg",
    label: "Twitter",
    urlPrefix: "https://twitter.com/",
    ensText: ["com.twitter", "vnd.twitter", "twitter"],
    dotbitText: ["profile.twitter"],
  },
  [PlatformType.ens]: {
    key: PlatformType.ens,
    color: "#5298FF",
    icon: "icons/icon-ens.svg",
    label: "ENS",
    urlPrefix: "https://app.ens.domains/search/",
  },
  [PlatformType.ethereum]: {
    key: PlatformType.ethereum,
    color: "#3741ba",
    icon: "icons/icon-ethereum.svg",
    label: "Ethereum",
    urlPrefix: "https://etherscan.io/address/",
  },
  [PlatformType.farcaster]: {
    key: PlatformType.farcaster,
    color: "#8a63d2",
    icon: "icons/icon-farcaster.svg",
    label: "Farcaster",
    urlPrefix: "https://warpcast.com/",
    ensText: ["farcaster"],
  },
  [PlatformType.github]: {
    key: PlatformType.github,
    color: "#000000",
    icon: "icons/icon-github.svg",
    label: "GitHub",
    urlPrefix: "https://github.com/",
    ensText: ["com.github", "vnd.github"],
    dotbitText: ["profile.github"],
  },
  [PlatformType.keybase]: {
    key: PlatformType.keybase,
    color: "#4162E2",
    icon: "icons/icon-keybase.svg",
    label: "Keybase",
    urlPrefix: "https://keybase.io/",
    ensText: ["io.keybase"],
  },
  [PlatformType.lens]: {
    key: PlatformType.lens,
    color: "#6bc674",
    icon: "icons/icon-lens.svg",
    label: "Lens",
    urlPrefix: "https://hey.xyz/",
    ensText: ["lens"],
  },
  [PlatformType.nextid]: {
    key: PlatformType.nextid,
    color: "#000000",
    icon: "icons/icon-nextid.svg",
    label: "Next.ID",
    urlPrefix: "https://web3.bio/",
    dotbitText: ["profile.nextid"],
  },
  [PlatformType.reddit]: {
    key: PlatformType.reddit,
    color: "#ff4500",
    icon: "icons/icon-reddit.svg",
    label: "Reddit",
    urlPrefix: "https://www.reddit.com/user/",
    ensText: ["com.reddit"],
    dotbitText: ["profile.reddit"],
  },
  [PlatformType.space_id]: {
    key: PlatformType.space_id,
    color: "#71EBAA",
    icon: "icons/icon-spaceid.svg",
    label: "SPACE ID",
    urlPrefix: "https://space.id/search?query=",
  },
  [PlatformType.unstoppableDomains]: {
    key: PlatformType.unstoppableDomains,
    color: "#2E65F5",
    icon: "icons/icon-unstoppabledomains.svg",
    label: "Unstoppable Domains",
    urlPrefix: "https://unstoppabledomains.com/search?searchTerm=",
  },
  [PlatformType.ckb]: {
    key: PlatformType.ckb,
    color: "#000000",
    icon: "icons/icon-ckb.svg",
    label: "Nervos",
    urlPrefix: "https://explorer.nervos.org/address/",
  },
  [PlatformType.telegram]: {
    key: PlatformType.telegram,
    color: "#0088cc",
    icon: "icons/icon-telegram.svg",
    label: "Telegram",
    ensText: ["org.telegram", "vnd.telegram", "VND.TELEGRAM"],
    dotbitText: ["profile.telegram"],
    urlPrefix: "https://t.me/",
  },
  [PlatformType.instagram]: {
    key: PlatformType.instagram,
    color: "#EA3377",
    icon: "icons/icon-instagram.svg",
    label: "Instagram",
    ensText: ["com.instagram"],
    dotbitText: ["profile.instagram"],
    urlPrefix: "https://www.instagram.com/",
  },
  [PlatformType.weibo]: {
    key: PlatformType.weibo,
    color: "#df2029",
    label: "Weibo",
    dotbitText: ["profile.weibo"],
    urlPrefix: "https://weibo.com/",
  },
  [PlatformType.dotbit]: {
    key: PlatformType.dotbit,
    color: "#0e7dff",
    icon: "icons/icon-dotbit.svg",
    label: ".bit",
    urlPrefix: "https://data.did.id/",
  },
  [PlatformType.rss3]: {
    key: PlatformType.rss3,
    color: "#3070F6",
    label: "RSS3",
    urlPrefix: "https://rss3.io/",
  },
  [PlatformType.cyberconnect]: {
    key: PlatformType.cyberconnect,
    color: "#000000",
    icon: "icons/icon-cyberconnect.svg",
    label: "CyberConnect",
    urlPrefix: "https://link3.to/",
  },
  [PlatformType.opensea]: {
    key: PlatformType.opensea,
    color: "#407FDB",
    icon: "icons/icon-opensea.svg",
    label: "OpenSea",
    ensText: [],
    urlPrefix: "https://opensea.io/",
  },
  [PlatformType.sybil]: {
    key: PlatformType.sybil,
    color: "#4125E1",
    icon: "icons/icon-sybil.svg",
    label: "Sybil",
    urlPrefix: "https://sybil.org/",
  },
  [PlatformType.discord]: {
    key: PlatformType.discord,
    color: "#5865f2",
    icon: "icons/icon-discord.svg",
    label: "Discord",
    urlPrefix: "",
    ensText: ["com.discord"],
    dotbitText: ["profile.discord"],
  },
  [PlatformType.url]: {
    key: PlatformType.url,
    icon: "icons/icon-web.svg",
    color: "#121212",
    label: "Website",
    urlPrefix: "",
  },
  [PlatformType.website]: {
    key: PlatformType.website,
    icon: "icons/icon-web.svg",
    color: "#121212",
    label: "Website",
    urlPrefix: "",
    ensText: ["url"],
    dotbitText: ["profile.website"],
  },
  [PlatformType.linkedin]: {
    key: PlatformType.linkedin,
    color: "#195DB4",
    label: "LinkedIn",
    icon: "icons/icon-linkedin.svg",
    ensText: ["com.linkedin"],
    urlPrefix: "https://www.linkedin.com/in/",
    dotbitText: ["profile.linkedin"],
  },
  [PlatformType.dns]: {
    key: PlatformType.dns,
    icon: "icons/icon-web.svg",
    color: "#000000",
    label: "DNS",
    urlPrefix: "https://",
  },
  [PlatformType.tron]: {
    key: PlatformType.tron,
    color: "#EB0029",
    icon: "icons/icon-tron.svg",
    label: "Tron",
    urlPrefix: "https://tronscan.org/#/address/",
  },
  [PlatformType.lenster]: {
    key: PlatformType.lenster,
    icon: "icons/icon-lenster.svg",
    color: "#845EEE",
    label: "Lenster",
    urlPrefix: "https://lenster.xyz/u/",
  },
  [PlatformType.hey]: {
    key: PlatformType.hey,
    icon: "icons/icon-hey.svg",
    color: "#E84F64",
    label: "Hey",
    urlPrefix: "https://hey.xyz/u/",
  },
  [PlatformType.facebook]: {
    key: PlatformType.facebook,
    icon: "icons/icon-facebook.svg",
    color: "#385898",
    label: "Facebook",
    urlPrefix: "https://www.facebook.com/",
    dotbitText: ["profile.facebook"],
  },
  [PlatformType.threads]: {
    key: PlatformType.threads,
    icon: "icons/icon-threads.svg",
    color: "#000000",
    label: "Threads",
    urlPrefix: "https://www.threads.net/",
  },
  [PlatformType.youtube]: {
    key: PlatformType.youtube,
    icon: "icons/icon-youtube.svg",
    color: "#FF0000",
    label: "Youtube",
    urlPrefix: "https://www.youtube.com/",
    dotbitText: ["profile.youtube"],
  },
  [PlatformType.tiktok]: {
    key: PlatformType.tiktok,
    icon: "",
    color: "#000000",
    label: "TikTok",
    urlPrefix: "https://www.tiktok.com/",
    dotbitText: ["profile.tiktok"],
  },
  [PlatformType.bilibili]: {
    key: PlatformType.bilibili,
    icon: "",
    color: "#00aeec",
    label: "Bilibili",
    urlPrefix: "https://www.bilibili.com/",
    dotbitText: ["profile.bilibili"],
  },
  [PlatformType.medium]: {
    key: PlatformType.medium,
    icon: "icons/icon-medium.svg",
    color: "#000000",
    label: "Medium",
    urlPrefix: "https://medium.com/",
    dotbitText: ["profile.medium"],
  },
  [PlatformType.mirror]: {
    key: PlatformType.mirror,
    icon: "icons/icon-mirror.svg",
    color: "#007aff",
    label: "Mirror",
    urlPrefix: "https://mirror.xyz/",
    dotbitText: ["profile.mirror"],
  },
  [PlatformType.jike]: {
    key: PlatformType.jike,
    icon: "",
    color: "#ffe411",
    label: "Jike",
    urlPrefix: "https://web.okjike.com/",
    dotbitText: ["profile.jike"],
  },
  [PlatformType.nostr]: {
    key: PlatformType.nostr,
    icon: "icons/icon-nostr.svg",
    color: "#0ea5e9",
    label: "Nostr",
    urlPrefix: "https://app.coracle.social/",
    dotbitText: ["profile.nostr"],
  },
  [PlatformType.poap]: {
    key: PlatformType.poap,
    icon: "icons/icon-poap.svg",
    color: "#5E58A5",
    label: "POAP",
    urlPrefix: "https://app.poap.xyz/scan/",
  },
  [PlatformType.dribbble]: {
    key: PlatformType.dribbble,
    icon: "icons/icon-dribbble.svg",
    color: "#AB5697",
    label: "Dribbble",
    urlPrefix: "https://dribbble.com/search/",
    dotbitText: ["profile.dribbble"],
  },
  [PlatformType.knn3]: {
    key: PlatformType.knn3,
    color: "#000000",
    label: "KNN3",
    urlPrefix: "https://www.knn3.xyz/",
  },
  [PlatformType.ethLeaderboard]: {
    key: PlatformType.ethLeaderboard,
    color: "#000000",
    label: ".eth LeaderBoard",
    urlPrefix: "https://ethleaderboard.xyz/",
  },

  [PlatformType.the_graph]: {
    key: PlatformType.the_graph,
    color: "#000000",
    label: "The Graph",
    urlPrefix: "https://thegraph.com/",
  },
  [PlatformType.rpc_server]: {
    key: PlatformType.rpc_server,
    icon: "icons/icon-web.svg",
    color: "#000000",
    label: "RPC Server",
    urlPrefix: "",
  },
  [PlatformType.twitter_hexagon]: {
    key: PlatformType.twitter_hexagon,
    icon: "icons/icon-twitter.svg",
    color: "#4A99E9",
    label: "Twitter Hexagon",
    urlPrefix: "https://twitter.com/",
  },
  [PlatformType.uniswap]: {
    key: PlatformType.uniswap,
    color: "#ff007a",
    label: "Uniswap",
    urlPrefix: "https://uniswap.org/",
  },
  [PlatformType.degenscore]: {
    key: PlatformType.degenscore,
    icon: "icons/icon-degenscore.svg",
    color: "#a855f7",
    label: "DegenScore",
    urlPrefix: "https://degenscore.com/beacon/",
  },
  [PlatformType.firefly]: {
    key: PlatformType.firefly,
    icon: "icons/icon-firefly.svg",
    color: "#D543ED",
    label: "Firefly",
    urlPrefix: "https://firefly.land/",
  },
};

export const supportedPlatforms = [
  PlatformType.ens,
  PlatformType.lens,
  PlatformType.farcaster,
  PlatformType.dotbit,
  PlatformType.unstoppableDomains,
];
