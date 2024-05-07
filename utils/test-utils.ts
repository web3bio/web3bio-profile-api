import { baseURL } from "./base";
export const queryClient = async (path: string) => {
  return await fetch(baseURL + path);
};
