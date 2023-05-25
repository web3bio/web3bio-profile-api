import { LensParamType } from "@/pages/api/profile/lens/[handle]";

export const getLensProfileQuery = (type: LensParamType) => {
  const queryNamespace =
    type === LensParamType.address ? "defaultProfile" : "profile";
  const paramsNamespace =
    type === LensParamType.address
      ? "$handle: EthereumAddress!"
      : "$handle: Handle";
  const requestNamespace =
    type === LensParamType.address
      ? "ethereumAddress: $handle"
      : "handle: $handle ";
  return `
  query Profile(${paramsNamespace}) {
    ${queryNamespace}(request: { ${requestNamespace} }) {
      id
      name
      bio
      attributes {
        displayType
        traitType
        key
        value
      }
      picture {
        ... on NftImage {
          contractAddress
          tokenId
          uri
          verified
        }
        ... on MediaSet {
          original {
            url
            mimeType
          }
        }
        __typename
      }
      handle
      coverPicture {
        ... on NftImage {
          contractAddress
          tokenId
          uri
          verified
        }
        ... on MediaSet {
          original {
            url
            mimeType
          }
        }
        __typename
      }
      ownedBy
    }
  }
`;
};

