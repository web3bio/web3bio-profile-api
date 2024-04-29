export const enum LensParamType {
  domain = "domain",
  address = "address",
}

export const getLensProfileQuery = (type: LensParamType) => {
  const queryNamespace =
    type === LensParamType.address ? "defaultProfile" : "profile";
  const requestNamespace =
    type === LensParamType.address ? "DefaultProfileRequest" : "ProfileRequest";
  return `
  query Profile($request: ${requestNamespace}!) {
    ${queryNamespace}(request: $request) {
      id
      ownedBy {
        chainId
        address
      }
      metadata {
        displayName
        bio
        rawURI
        appId
        coverPicture {
          optimized {
            uri
            mimeType
          }
          raw {
            mimeType
            uri
          }
        }
        attributes {
          value
          key
          type
        }
        picture {
          ... on ImageSet {
            raw {
              uri
              mimeType
            }
            optimized {
              mimeType
              uri
            }
          }
        }
      }
      handle {
        id
        fullHandle
        namespace
        localName
        suggestedFormatted {
          full
          localName
        }
        linkedTo {
          nftTokenId
          contract {
            address
            chainId
          }
        }
        ownedBy
      }
    }
  }
`;
};
