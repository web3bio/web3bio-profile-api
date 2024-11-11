import { resolveSNSHandle } from "@/app/api/profile/sns/[handle]/utils";

export const resolveSNSHandleNS = async (handle: string) => {
  return await resolveSNSHandle(handle, true);
};
