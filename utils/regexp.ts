export const regexEns = /^.+\.(eth|xyz|bio|app|luxe|kred|art|ceo|club|box)$/i,
  regexBasenames = /^.+\.base(\.eth)?$/i,
  regexLinea = /^.+\.linea(\.eth)?$/i,
  regexFarcaster =
    /^(?:[A-Za-z0-9_-]{1,61}(?:(?:\.eth)?(?:\.farcaster|\.fcast\.id|\.farcaster\.eth)?)?|farcaster,#\d+)$/i,
  regexLens = /^(?:.+\.lens)$/i,
  regexCluster = /^[\w-]+\/[\w-]+$/,
  regexSpaceid = /^.+\.(bnb|arb)$/i,
  regexGravity = /^.+\.g$/,
  regexGenome = /^.+\.gno$/i,
  regexUnstoppableDomains =
    /^.+\.(crypto|888|nft|blockchain|bitcoin|dao|x|klever|hi|zil|kresus|polygon|wallet|binanceus|anime|go|manga|eth)$/i,
  regexCrossbell = /^.+\.csb$/i,
  regexDotbit = /^.+\.bit$/i,
  regexSns = /^.+\.sol$/i,
  regexEth = /^0x[a-fA-F0-9]{40}$/i,
  regexBtc = /\b([13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[qp][a-z0-9]{11,71})\b/,
  regexSolana = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
  regexLowercaseExempt =
    /\b(?:(?:[13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[qp][a-z0-9]{11,71})|(?:[1-9A-HJ-NP-Za-km-z]{32,44}))\b/,
  regexTwitter = /^[A-Za-z0-9_]{1,15}(?:\.twitter)?$/i,
  regexNext = /^0x[a-f0-9]{66}(?:\.nextid)?$/i,
  regexEIP = /^eip155:(\d+)\/(erc1155|erc721):(.+)\/(.+)$/i,
  regexDomain = /^(?:https?:\/\/)?(?:[^@\/\n]+@)?(?:www\.)?([^:\/\n]+)/,
  regexTon = /^(EQ|UQ)[a-zA-Z0-9_-]{46}$/,
  regexEmoji =
    /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/gi;
