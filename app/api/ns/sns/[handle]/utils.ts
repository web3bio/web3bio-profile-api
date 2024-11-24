import { resolveSNSHandle } from "@/app/api/profile/sns/[handle]/utils";
import { AuthHeaders } from "@/utils/types";

export const resolveSNSHandleNS = async (
  handle: string,
  headers: AuthHeaders
) => {
  return await resolveSNSHandle(handle, headers, true);
};
