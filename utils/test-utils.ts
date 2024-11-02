import { BASE_URL } from "./base";

export const queryClient = async (
  path: string,
  options?: any,
  base?: string
) => {
  return await fetch((base || BASE_URL) + path, { ...options });
};
