import { PlatformType } from "@/utils/platform";
import { getLensDefaultAvatar, resolveEipAssetURL } from "@/utils/resolver";
import { IdentityRecord, ProfileRecord } from "@/utils/types";

const processAvatar = async (profile: ProfileRecord) => {
  if (!profile) return null;
  const _profile = JSON.parse(JSON.stringify(profile));

  try {
    _profile.avatar = await resolveEipAssetURL(
      _profile?.avatar,
      profile.identity
    );
  } catch {
    _profile.avatar = null;
  }
  if (
    _profile.platform === PlatformType.lens &&
    !_profile.avatar &&
    _profile?.social?.uid
  ) {
    _profile.avatar = await getLensDefaultAvatar(Number(_profile.social.uid));
  }

  return _profile;
};

export const processJson = async (json: any) => {
  const _json = JSON.parse(JSON.stringify(json));
  const identity = _json?.data?.identity;
  if (identity?.profile) {
    identity.profile = await processAvatar(identity.profile);
  }

  if (identity?.identityGraph?.vertices?.length > 0) {
    if (
      !identity?.identityGraph?.vertices?.some(
        (x: IdentityRecord) =>
          x.identity === identity.identity && x.platform === identity.platform
      )
    ) {
      const _identity = JSON.parse(JSON.stringify(identity));
      delete _identity.identityGraph;
      identity?.identityGraph?.vertices.unshift(_identity);
    } else {
      const index = identity.identityGraph.vertices.findIndex(
        (x: IdentityRecord) =>
          x.platform === identity.platform && x.identity === identity.identity
      );
      if (index !== -1) {
        const item = identity.identityGraph.vertices[index];
        identity.identityGraph.vertices.splice(index, 1);
        identity.identityGraph.vertices.unshift(item);
      }
    }

    for (let i = 0; i < identity.identityGraph.vertices.length; i++) {
      const item = identity.identityGraph.vertices[i];
      if (item?.profile) {
        item.profile = await processAvatar(item.profile);
      }
    }
  }
  return _json;
};
