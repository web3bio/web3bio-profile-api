import { Platform } from "web3bio-profile-kit/types";

type IdentityReference = {
  identity?: string | null;
  platform?: Platform | null;
};

export const GENERATED_LENS_IDENTITY_REGEX = /^ff-\d{10}\.lens$/i;

export const shouldFilterAssociatedLensProfile = (
  candidate: IdentityReference,
  directTarget: IdentityReference,
): boolean => {
  const candidateIdentity = candidate.identity?.trim() || "";
  if (
    candidate.platform !== Platform.lens ||
    !GENERATED_LENS_IDENTITY_REGEX.test(candidateIdentity)
  ) {
    return false;
  }

  const directIdentity = directTarget.identity?.trim() || "";
  const isDirectTarget =
    directTarget.platform === Platform.lens &&
    candidateIdentity.toLowerCase() === directIdentity.toLowerCase();

  return !isDirectTarget;
};
