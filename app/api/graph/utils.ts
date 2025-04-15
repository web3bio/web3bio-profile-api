import { getLensDefaultAvatar, resolveEipAssetURL } from "@/utils/resolver";
import { IdentityRecord, ProfileRecord } from "@/utils/types";

const processProfileAvatar = async (
  profile: ProfileRecord,
): Promise<string | null> => {
  if (!profile) return null;

  let avatarUrl = profile.avatar;

  if (avatarUrl) {
    try {
      avatarUrl = await resolveEipAssetURL(avatarUrl);
    } catch {
      avatarUrl = null;
    }
  }

  return avatarUrl;
};

export const processJson = async (json: any) => {
  const _json = structuredClone(json);
  const identity = _json?.data?.identity;

  if (!identity) return _json;

  // Process main identity avatar in parallel with vertices
  const promises = [];

  if (identity.profile) {
    promises.push(
      processProfileAvatar(identity.profile).then((processedAvatar) => {
        identity.profile.avatar = processedAvatar;
      }),
    );
  }

  const vertices: IdentityRecord[] = identity.identityGraph?.vertices;
  if (vertices?.length > 0) {
    const currentIdentityExists = vertices.some(
      (x: IdentityRecord) =>
        x.identity === identity.identity && x.platform === identity.platform,
    );

    if (!currentIdentityExists) {
      const currentIdentity = { ...identity };
      delete currentIdentity.identityGraph;
      vertices.unshift(currentIdentity);
    } else {
      const index = vertices.findIndex(
        (x: IdentityRecord) =>
          x.platform === identity.platform && x.identity === identity.identity,
      );

      if (index > 0) {
        const item = vertices[index];
        vertices.copyWithin(1, 0, index);
        vertices[0] = item;
      }
    }

    // Process all avatars in parallel
    promises.push(
      Promise.allSettled(
        vertices
          .filter((item) => item?.profile)
          .map(async (item) => {
            const processedAvatar = await processProfileAvatar(item.profile);
            if (processedAvatar) {
              item.profile.avatar = processedAvatar;
            }
          }),
      ),
    );
  }

  // Wait for all processing to complete with Promise.allSettled
  await Promise.allSettled(promises);

  return _json;
};
